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
    'https://demo.mercure.rocks/.well-known/mercure?topic=https://example.com/books/1',
  );
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [connectionTime, setConnectionTime] = useState(0);
  const [filter, setFilter] = useState('');

  const eventSourceRef = useRef<EventSource | null>(null);
  const connectionStartRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isConnected]);

  const connect = () => {
    if (isConnected) return;

    try {
      // Use our proxy API to connect to external SSE endpoints
      const proxyUrl = `/api/sse?url=${encodeURIComponent(endpoint)}`;

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
    try {
      const parsedData = JSON.parse(data);
      const message: SSEMessage = {
        id: id || Date.now().toString(),
        event: eventType,
        data: parsedData,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [message, ...prev.slice(0, 99)]); // Keep last 100 messages
      setMessageCount((prev) => prev + 1);

      // Handle special events
      if (eventType === 'end') {
        toast.info('Stream ended by server');
        disconnect();
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
      // Handle non-JSON messages
      const message: SSEMessage = {
        id: id || Date.now().toString(),
        event: eventType,
        data: data,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [message, ...prev.slice(0, 99)]);
      setMessageCount((prev) => prev + 1);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SSE Connection</CardTitle>
            <CardDescription>
              Connect to server-sent event streams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SSE Endpoint URL</label>
                <Input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://demo.mercure.rocks/.well-known/mercure?topic=https://example.com/books/1"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a complete SSE endpoint URL. CORS must be properly
                  configured on the target server.
                </p>
              </div>

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
                <p>Endpoint: {endpoint}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
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
                    {filteredMessages.map((message) => (
                      <div
                        key={`${message.id}-${message.timestamp}`}
                        className="border border-border rounded p-3 bg-background"
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
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground">
                          {formatData(message.data)}
                        </pre>
                        {message.id && (
                          <div className="text-xs text-muted-foreground mt-1">
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
