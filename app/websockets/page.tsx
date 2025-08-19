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
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface WebSocketMessage {
  id: string;
  type: 'sent' | 'received' | 'error' | 'connection';
  content: string;
  timestamp: string;
}

export default function WebSocketsPage() {
  const [url, setUrl] = useState('wss://echo.websocket.org');
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState(
    '{"type": "message", "data": "Hello WebSocket!"}',
  );
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [messagesSent, setMessagesSent] = useState(0);
  const [messagesReceived, setMessagesReceived] = useState(0);
  const [connectionTime, setConnectionTime] = useState(0);
  const [protocols, setProtocols] = useState('');
  const [headers, setHeaders] = useState('');
  const [autoReconnect, setAutoReconnect] = useState(false);
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  const eventSourceRef = useRef<EventSource | null>(null);
  const connectionStartRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(Date.now().toString());

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Send disconnect signal to server
    if (isConnected) {
      fetch('/api/websockets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          action: 'disconnect',
        }),
      }).catch((error) => {
        console.error('Error disconnecting WebSocket:', error);
      });
    }

    setIsConnected(false);
  }, [isConnected]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const addMessage = (type: WebSocketMessage['type'], content: string) => {
    const newMessage: WebSocketMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [newMessage, ...prev.slice(0, 99)]); // Keep last 100 messages
  };

  const connect = () => {
    if (isConnected || !url) return;

    try {
      // Generate a new session ID for this connection
      sessionIdRef.current = Date.now().toString();

      // Create proxy URL for WebSocket connection
      const protocolParam = protocols
        ? `&protocols=${encodeURIComponent(protocols)}`
        : '';
      const proxyUrl = `/api/websockets?url=${encodeURIComponent(url)}&sessionId=${sessionIdRef.current}${protocolParam}`;

      eventSourceRef.current = new EventSource(proxyUrl);
      connectionStartRef.current = Date.now();

      // Start connection timer
      timerRef.current = window.setInterval(() => {
        setConnectionTime(
          Math.floor((Date.now() - connectionStartRef.current) / 1000),
        );
      }, 1000);

      eventSourceRef.current.onopen = () => {
        // Don't set connected here - wait for the actual WebSocket connection event
      };

      eventSourceRef.current.addEventListener('connection', (event) => {
        const data = JSON.parse(event.data);
        addMessage(data.type, data.content);

        if (data.content.includes('opened')) {
          setIsConnected(true);
          setConnectionTime(0);
          toast.success('WebSocket connected!');
        } else if (
          data.content.includes('closed') ||
          data.content.includes('lost')
        ) {
          setIsConnected(false);
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          toast.info('WebSocket disconnected');

          // Auto-reconnect if enabled and connection wasn't closed intentionally
          if (autoReconnect && data.content.includes('lost')) {
            setTimeout(() => {
              if (!isConnected) {
                toast.info('Attempting to reconnect...');
                connect();
              }
            }, 3000);
          }
        }
      });

      eventSourceRef.current.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        setMessagesReceived((prev) => prev + 1);
        addMessage(data.type, data.content);
      });

      eventSourceRef.current.addEventListener('error', (event) => {
        const data = JSON.parse(event.data);
        addMessage(data.type, data.content);
        toast.error('WebSocket connection error');
      });

      eventSourceRef.current.onerror = (error) => {
        console.error('EventSource error:', error);
        toast.error('Failed to connect to WebSocket');
        disconnect();
      };
    } catch (error) {
      toast.error('Failed to connect to WebSocket');
      console.error('Connection error:', error);
    }
  };

  const sendMessage = async () => {
    if (!isConnected) {
      toast.error('WebSocket is not connected');
      return;
    }

    if (!message.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/websockets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          action: 'send',
          message: message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      setMessagesSent((prev) => prev + 1);
      addMessage('sent', message);
      toast.success('Message sent!');
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send error:', error);
    }
  };

  const sendPing = async () => {
    if (!isConnected) {
      toast.error('WebSocket is not connected');
      return;
    }

    try {
      const response = await fetch('/api/websockets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          action: 'ping',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send ping');
      }

      setMessagesSent((prev) => prev + 1);
      addMessage('sent', 'ping');
      toast.success('Ping sent!');
    } catch (error) {
      toast.error('Failed to send ping');
      console.error('Ping error:', error);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setMessagesSent(0);
    setMessagesReceived(0);
    toast.info('Message history cleared');
  };

  const exportMessages = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `websocket-messages-${
      new Date().toISOString().split('T')[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Messages exported!');
  };

  const getConnectionStatus = () => {
    if (!eventSourceRef.current) return 'Disconnected';
    if (eventSourceRef.current.readyState === EventSource.CONNECTING) {
      return 'Connecting';
    }
    if (eventSourceRef.current.readyState === EventSource.OPEN && isConnected) {
      return 'Connected';
    }
    if (eventSourceRef.current.readyState === EventSource.CLOSED) {
      return 'Disconnected';
    }
    return 'Unknown';
  };

  const getStatusColor = () => {
    if (!eventSourceRef.current) return 'bg-red-500';
    if (eventSourceRef.current.readyState === EventSource.CONNECTING) {
      return 'bg-yellow-500';
    }
    if (eventSourceRef.current.readyState === EventSource.OPEN && isConnected) {
      return 'bg-green-500';
    }
    if (eventSourceRef.current.readyState === EventSource.CLOSED) {
      return 'bg-red-500';
    }
    return 'bg-gray-500';
  };

  const getMessageTypeColor = (type: WebSocketMessage['type']) => {
    switch (type) {
      case 'sent':
        return 'text-blue-600';
      case 'received':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'connection':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (!filter) return true;
    const searchStr = filter.toLowerCase();
    return (
      msg.type.toLowerCase().includes(searchStr) ||
      msg.content.toLowerCase().includes(searchStr)
    );
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">WebSockets</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>WebSocket Connection</CardTitle>
            <CardDescription>
              Connect to WebSocket servers for real-time communication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">WebSocket URL</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="wss://echo.websocket.org"
                  disabled={isConnected}
                />
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
              Monitor your WebSocket connection health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${getStatusColor()}`}
                ></div>
                <span className="text-sm">{getConnectionStatus()}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Messages sent: {messagesSent}</p>
                <p>Messages received: {messagesReceived}</p>
                <p>Connection time: {connectionTime}s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
            <CardDescription>
              Send messages through the WebSocket connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder='{"type": "message", "data": "Hello WebSocket!"}'
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={sendMessage}
                  disabled={!isConnected}
                  className="flex-1"
                >
                  Send Message
                </Button>
                <Button
                  onClick={sendPing}
                  variant="outline"
                  disabled={!isConnected}
                  className="flex-1"
                >
                  Send Ping
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection Settings</CardTitle>
            <CardDescription>
              Configure WebSocket connection options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Protocols</label>
                <Input
                  value={protocols}
                  onChange={(e) => setProtocols(e.target.value)}
                  placeholder="chat, superchat"
                  disabled={isConnected}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Headers</label>
                <textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Authorization: Bearer token&#10;Origin: https://example.com"
                  disabled={isConnected}
                />
                <p className="text-xs text-muted-foreground">
                  Note: Custom headers are not supported by browser WebSocket
                  API
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-reconnect"
                  checked={autoReconnect}
                  onChange={(e) => setAutoReconnect(e.target.checked)}
                />
                <label htmlFor="auto-reconnect" className="text-sm">
                  Auto-reconnect
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Message History</CardTitle>
            <CardDescription>
              Real-time display of sent and received WebSocket messages
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={autoScroll ? 'bg-blue-50' : ''}
                >
                  Auto-scroll: {autoScroll ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="min-h-[400px] max-h-[600px] overflow-y-auto rounded-md border p-4 bg-muted">
                {filteredMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {filter
                      ? 'No messages match the filter...'
                      : 'Connect to a WebSocket to see messages here...'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="border border-border rounded p-3 bg-background"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-mono font-semibold ${getMessageTypeColor(
                              msg.type,
                            )}`}
                          >
                            {msg.type.toUpperCase()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground">
                          {msg.content}
                        </pre>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  Clear History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportMessages}
                  disabled={messages.length === 0}
                >
                  Export Messages
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
