'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface SSEMessage {
  id: string;
  event: string;
  data: unknown;
  timestamp: string;
}

export default function SSEPage() {
  const [endpoint, setEndpoint] = useState(
    'https://stream.wikimedia.org/v2/stream/recentchange',
  );
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [headers, setHeaders] = useState(
    JSON.stringify(
      { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      null,
      2,
    ),
  );
  const [body, setBody] = useState();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [connectionTime, setConnectionTime] = useState(0);
  const [filter, setFilter] = useState('');

  const eventSourceRef = useRef<EventSource | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const connectionStartRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (readerRef.current && typeof readerRef.current.cancel === 'function') {
        readerRef.current.cancel().catch(() => {});
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const connect = async () => {
    if (isConnected) return;

    // Validate headers JSON
    let parsedHeaders = {};
    try {
      if (headers.trim()) {
        parsedHeaders = JSON.parse(headers);
      }
    } catch {
      toast.error('Invalid JSON in headers field');
      return;
    }

    // Validate body JSON for POST requests
    let parsedBody = null;
    if (method === 'POST') {
      try {
        if (body.trim()) {
          parsedBody = JSON.parse(body);
        }
      } catch {
        toast.error('Invalid JSON in body field');
        return;
      }
    }

    try {
      // For POST requests, we need to use our API endpoint
      // EventSource doesn't support POST, so we'll create the connection differently
      if (method === 'POST') {
        // Use fetch API with streaming for POST
        const proxyUrl = `/api/sse?url=${encodeURIComponent(endpoint)}&method=POST`;

        // Create abort controller for request cancellation
        abortControllerRef.current = new AbortController();

        console.log('Connecting to SSE endpoint:', endpoint);
        console.log('Request headers:', parsedHeaders);
        console.log('Request body:', parsedBody);

        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            headers: parsedHeaders,
            body: parsedBody,
          }),
          signal: abortControllerRef.current.signal,
        });

        console.log('Response status:', response.status, response.statusText);
        console.log(
          'Response headers:',
          Object.fromEntries(response.headers.entries()),
        );

        if (!response.ok) {
          toast.error('Failed to connect to SSE endpoint');
          return;
        }

        // Process the stream
        const reader = response.body?.getReader();
        if (!reader) {
          toast.error('No response body');
          return;
        }

        readerRef.current = reader;

        // Set connection state AFTER confirming we have a valid reader
        connectionStartRef.current = Date.now();
        setIsConnected(true);
        setMessages([]);
        setMessageCount(0);
        setConnectionTime(0);

        // Start connection timer
        timerRef.current = window.setInterval(() => {
          setConnectionTime(
            Math.floor((Date.now() - connectionStartRef.current) / 1000),
          );
        }, 1000);

        toast.success('SSE connection established!');
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = async () => {
          try {
            console.log('Starting to process SSE stream...');
            let chunkCount = 0;
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                // Stream ended naturally
                console.log(
                  `Stream completed after ${chunkCount} chunks. Buffer remaining:`,
                  buffer,
                );
                disconnect();
                break;
              }

              chunkCount++;
              const decoded = decoder.decode(value, { stream: true });
              buffer += decoded;

              // SSE events are separated by double newlines
              const events = buffer.split('\n\n');
              // Keep the last incomplete event in the buffer
              buffer = events.pop() || '';

              for (const event of events) {
                if (!event.trim()) continue; // Skip empty events

                const lines = event.split('\n');
                let eventType = 'message';
                let eventData = '';
                let eventId = '';

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    eventData += line.slice(6);
                  } else if (line.startsWith('data:')) {
                    eventData += line.slice(5);
                  } else if (line.startsWith('event: ')) {
                    eventType = line.slice(7);
                  } else if (line.startsWith('id: ')) {
                    eventId = line.slice(4);
                  }
                }

                if (eventData) {
                  if (eventData === '[DONE]') {
                    disconnect();
                    break;
                  }
                  handleMessage(eventType, eventData, eventId || undefined);
                }
              }
            }
          } catch (error) {
            // Only show error if it's not an abort error
            if (error instanceof Error && error.name !== 'AbortError') {
              console.error('Stream error:', error);
              toast.error('Stream connection error');
            }
            disconnect();
          }
        };

        processStream();
        return;
      }

      // For GET requests, use EventSource as before
      const proxyUrl = `/api/sse?url=${encodeURIComponent(endpoint)}&method=GET`;

      eventSourceRef.current = new EventSource(proxyUrl);
      connectionStartRef.current = Date.now();
      setIsConnected(true);
      setMessages([]);
      setMessageCount(0);
      setConnectionTime(0);

      // Start connection timer
      timerRef.current = window.setInterval(() => {
        setConnectionTime(
          Math.floor((Date.now() - connectionStartRef.current) / 1000),
        );
      }, 1000);

      eventSourceRef.current.onopen = () => {
        toast.success('SSE connection established!');
      };

      eventSourceRef.current.onmessage = (event) => {
        handleMessage('message', event.data, event.lastEventId);
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('SSE Error:', error);
        toast.error('SSE connection error');
        disconnect();
      };
    } catch (error) {
      toast.error('Failed to connect to SSE endpoint');
      console.error('Connection error:', error);
    }
  };

  const handleMessage = (eventType: string, data: string, id?: string) => {
    // console.log('handleMessage called with:', { eventType, data, id });

    let finalData: unknown = data;

    // Try to parse as JSON if it's a string
    if (typeof data === 'string') {
      try {
        finalData = JSON.parse(data);
      } catch {
        // Not JSON, use as-is
        finalData = data;
      }
    }

    const message: SSEMessage = {
      id: id || Date.now().toString(),
      event: eventType,
      data: finalData,
      timestamp: new Date().toISOString(),
    };

    // console.log('Adding message to state:', message);
    setMessages((prev) => {
      const newMessages = [message, ...prev.slice(0, 99)];
      return newMessages;
    });
    setMessageCount((prev) => {
      return prev + 1;
    });

    // Handle special events
    if (eventType === 'end') {
      toast.info('Stream ended by server');
      disconnect();
    }
  };

  const disconnect = () => {
    // Clean up EventSource (for GET requests)
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clean up fetch stream reader (for POST requests)
    if (readerRef.current) {
      if (typeof readerRef.current.cancel === 'function') {
        readerRef.current.cancel().catch(() => {
          // Ignore cancel errors
        });
      }
      readerRef.current = null;
    }

    // Abort fetch request if still ongoing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clean up timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsConnected(false);
    toast.info('SSE connection closed');
  };

  const clearMessages = () => {
    setMessages([]);
    setMessageCount(0);
    toast.info('Messages cleared');
  };

  const exportMessages = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sse-messages-${
      new Date().toISOString().split('T')[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Messages exported!');
  };

  const filteredMessages = messages.filter((msg) => {
    if (!filter) return true;
    const searchStr = filter.toLowerCase();
    return (
      msg.event.toLowerCase().includes(searchStr) ||
      JSON.stringify(msg.data).toLowerCase().includes(searchStr)
    );
  });

  const formatData = (data: unknown): string => {
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  const getEventColor = (event: string): string => {
    const colors: Record<string, string> = {
      connect: 'text-green-600',
      demo: 'text-blue-600',
      counter: 'text-purple-600',
      random: 'text-orange-600',
      system: 'text-red-600',
      stock: 'text-emerald-600',
      chat: 'text-pink-600',
      end: 'text-gray-600',
      message: 'text-gray-800',
    };
    return colors[event] || 'text-gray-600';
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Server-Sent Events (SSE)</h1>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>SSE Connection</CardTitle>
            <CardDescription>
              Connect to server-sent event streams with custom headers and body
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    SSE Endpoint URL
                  </label>
                  <Input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="http://localhost:5000/llm/stream"
                    disabled={isConnected}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a complete SSE endpoint URL.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">HTTP Method</label>
                  <Select
                    value={method}
                    onValueChange={(value) =>
                      setMethod(value as 'GET' | 'POST')
                    }
                    disabled={isConnected}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the HTTP method for the request.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Custom Headers (JSON)
                </label>
                <Textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  placeholder='{"Content-Type": "application/json"}'
                  rows={4}
                  disabled={isConnected}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter custom headers as JSON. Leave empty for default headers.
                </p>
              </div>

              {method === 'POST' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Request Body (JSON)
                  </label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"prompt": "Your prompt here"}'
                    rows={8}
                    disabled={isConnected}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the request body as JSON for POST requests.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={connect}
                  disabled={isConnected}
                  className="flex-1"
                >
                  {isConnected ? 'Connected' : 'Connect'}
                </Button>
                <Button
                  onClick={disconnect}
                  variant="outline"
                  disabled={!isConnected}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>
                Monitor your SSE connection health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></div>
                  <span className="text-sm">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Messages received: {messageCount}</p>
                  <p>Connection time: {connectionTime}s</p>
                  <p>Method: {method}</p>
                  <p className="break-all">Endpoint: {endpoint}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>Current request configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground mb-1">Headers:</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {headers || 'None'}
                  </pre>
                </div>
                {method === 'POST' && body && (
                  <div>
                    <p className="font-medium text-foreground mb-1">Body:</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {body}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Stream</CardTitle>
            <CardDescription>
              Real-time display of incoming SSE messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Filter messages..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={clearMessages}>
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportMessages}
                  disabled={messages.length === 0}
                >
                  Export
                </Button>
              </div>

              <div className="min-h-[400px] max-h-[600px] overflow-y-auto rounded-md border p-4 bg-muted">
                {filteredMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {isConnected
                      ? 'Waiting for messages...'
                      : 'Connect to an SSE endpoint to see events here...'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredMessages.map((message, index) => (
                      <div
                        key={`${message.id}-${message.timestamp}-${index}`}
                        className="border border-border rounded p-3 bg-background overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-mono font-semibold ${getEventColor(
                              message.event,
                            )}`}
                          >
                            {message.event}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground overflow-x-auto">
                          {formatData(message.data)}
                        </pre>
                        {message.id && (
                          <div className="text-xs text-muted-foreground mt-1 break-all">
                            ID: {message.id}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
