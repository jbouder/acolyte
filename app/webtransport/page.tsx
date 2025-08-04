/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface WebTransportMessage {
  id: string;
  timestamp: number;
  type: "stream" | "datagram" | "system" | "error";
  direction: "sent" | "received";
  data: string;
  streamId?: number;
}

interface ConnectionStats {
  streamsCreated: number;
  datagramsSent: number;
  datagramsReceived: number;
  rtt: number | null;
  bandwidthUsage: number;
  packetLoss: number;
  congestionWindow: number;
  activeStreams: number;
}

export default function WebTransportPage() {
  const [url, setUrl] = useState("https://localhost:4433/webtransport");
  const [certificateHash, setCertificateHash] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [streamType, setStreamType] = useState("bidirectional");
  const [streamMessage, setStreamMessage] = useState('{"type": "message", "data": "Hello WebTransport!"}');
  const [datagramMessage, setDatagramMessage] = useState('{"type": "ping", "timestamp": 1234567890}');
  const [sendRate, setSendRate] = useState("10");
  const [maxStreams, setMaxStreams] = useState("100");
  const [connectionTimeout, setConnectionTimeout] = useState("30000");
  const [keepAlive, setKeepAlive] = useState(true);
  const [autoReconnect, setAutoReconnect] = useState(false);
  const [congestionControl, setCongestionControl] = useState(true);
  const [messages, setMessages] = useState<WebTransportMessage[]>([]);
  const [stats, setStats] = useState<ConnectionStats>({
    streamsCreated: 0,
    datagramsSent: 0,
    datagramsReceived: 0,
    rtt: null,
    bandwidthUsage: 0,
    packetLoss: 0,
    congestionWindow: 0,
    activeStreams: 0,
  });

  const transportRef = useRef<any>(null); // Using any due to WebTransport types not being fully available
  const streamsRef = useRef<Map<number, any>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addMessage = useCallback((message: Omit<WebTransportMessage, "id" | "timestamp">) => {
    const newMessage: WebTransportMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev.slice(-99), newMessage]); // Keep last 100 messages
  }, []);

  const updateStats = useCallback((updates: Partial<ConnectionStats>) => {
    setStats(prev => ({ ...prev, ...updates }));
  }, []);

  const checkWebTransportSupport = () => {
    return typeof (globalThis as any).WebTransport !== "undefined";
  };

  const connect = async () => {
    if (!checkWebTransportSupport()) {
      addMessage({
        type: "error",
        direction: "received",
        data: "WebTransport is not supported in this browser. Please use Chrome 97+ or Edge 97+.",
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      const transportOptions: any = {};
      
      if (certificateHash) {
        transportOptions.serverCertificateHashes = [{
          algorithm: "sha-256",
          value: Uint8Array.from(atob(certificateHash), c => c.charCodeAt(0))
        }];
      }

      const WebTransportClass = (globalThis as any).WebTransport;
      const transport = new WebTransportClass(url, transportOptions);
      transportRef.current = transport;

      addMessage({
        type: "system",
        direction: "sent",
        data: `Connecting to ${url}...`,
      });

      await transport.ready;
      
      setIsConnected(true);
      setIsConnecting(false);
      updateStats({ activeStreams: 0 });

      addMessage({
        type: "system",
        direction: "received",
        data: "WebTransport connection established successfully!",
      });

      // Listen for incoming datagrams
      const reader = transport.datagrams.readable.getReader();
      readDatagrams(reader);

      // Listen for incoming streams
      const streamReader = transport.incomingBidirectionalStreams.getReader();
      readIncomingStreams(streamReader);

      const uniStreamReader = transport.incomingUnidirectionalStreams.getReader();
      readIncomingUniStreams(uniStreamReader);

    } catch (error) {
      setIsConnecting(false);
      addMessage({
        type: "error",
        direction: "received",
        data: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const readDatagrams = async (reader: any) => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const data = new TextDecoder().decode(value);
        addMessage({
          type: "datagram",
          direction: "received",
          data,
        });
        
        setStats(prev => ({ 
          ...prev, 
          datagramsReceived: prev.datagramsReceived + 1 
        }));
      }
    } catch (error) {
      console.error("Error reading datagrams:", error);
    }
  };

  const readIncomingStreams = async (reader: any) => {
    try {
      while (true) {
        const { value: stream, done } = await reader.read();
        if (done) break;
        
        setStats(prev => ({ 
          ...prev, 
          activeStreams: prev.activeStreams + 1 
        }));

        // Read from the stream
        const streamReader = stream.readable.getReader();
        readFromStream(streamReader, "bidirectional");
      }
    } catch (error) {
      console.error("Error reading incoming streams:", error);
    }
  };

  const readIncomingUniStreams = async (reader: any) => {
    try {
      while (true) {
        const { value: stream, done } = await reader.read();
        if (done) break;
        
        setStats(prev => ({ 
          ...prev, 
          activeStreams: prev.activeStreams + 1 
        }));

        const streamReader = stream.getReader();
        readFromStream(streamReader, "unidirectional");
      }
    } catch (error) {
      console.error("Error reading incoming uni streams:", error);
    }
  };

  const readFromStream = async (reader: any, type: string) => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const data = new TextDecoder().decode(value);
        addMessage({
          type: "stream",
          direction: "received",
          data: `[${type}] ${data}`,
        });
      }
    } catch (error) {
      console.error("Error reading from stream:", error);
    }
  };

  const disconnect = () => {
    if (transportRef.current) {
      transportRef.current.close();
      transportRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    streamsRef.current.clear();
    setIsConnected(false);
    updateStats({
      streamsCreated: 0,
      datagramsSent: 0,
      datagramsReceived: 0,
      rtt: null,
      bandwidthUsage: 0,
      packetLoss: 0,
      congestionWindow: 0,
      activeStreams: 0,
    });

    addMessage({
      type: "system",
      direction: "sent",
      data: "WebTransport connection closed.",
    });
  };

  const sendViaStream = async () => {
    if (!transportRef.current || !isConnected) {
      addMessage({
        type: "error",
        direction: "sent",
        data: "Not connected to WebTransport server.",
      });
      return;
    }

    try {
      let stream;
      let writer;
      
      if (streamType === "bidirectional") {
        stream = await transportRef.current.createBidirectionalStream();
        writer = stream.writable.getWriter();
      } else {
        stream = await transportRef.current.createUnidirectionalStream();
        writer = stream.getWriter();
      }

      const encoder = new TextEncoder();
      
      await writer.write(encoder.encode(streamMessage));
      await writer.close();

      setStats(prev => ({ 
        ...prev, 
        streamsCreated: prev.streamsCreated + 1 
      }));

      addMessage({
        type: "stream",
        direction: "sent",
        data: `[${streamType}] ${streamMessage}`,
      });

    } catch (error) {
      addMessage({
        type: "error",
        direction: "sent",
        data: `Failed to send via stream: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const sendDatagram = async () => {
    if (!transportRef.current || !isConnected) {
      addMessage({
        type: "error",
        direction: "sent",
        data: "Not connected to WebTransport server.",
      });
      return;
    }

    try {
      const writer = transportRef.current.datagrams.writable.getWriter();
      const encoder = new TextEncoder();
      
      await writer.write(encoder.encode(datagramMessage));
      writer.releaseLock();

      setStats(prev => ({ 
        ...prev, 
        datagramsSent: prev.datagramsSent + 1 
      }));

      addMessage({
        type: "datagram",
        direction: "sent",
        data: datagramMessage,
      });

    } catch (error) {
      addMessage({
        type: "error",
        direction: "sent",
        data: `Failed to send datagram: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const startBurst = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const rate = parseInt(sendRate) || 10;
    intervalRef.current = setInterval(() => {
      sendDatagram();
    }, 1000 / rate);

    addMessage({
      type: "system",
      direction: "sent",
      data: `Started datagram burst at ${rate} messages per second.`,
    });
  };

  const stopBurst = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      
      addMessage({
        type: "system",
        direction: "sent",
        data: "Stopped datagram burst.",
      });
    }
  };

  const clearHistory = () => {
    setMessages([]);
  };

  const exportMessages = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webtransport-messages-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetMetrics = () => {
    setStats({
      streamsCreated: 0,
      datagramsSent: 0,
      datagramsReceived: 0,
      rtt: null,
      bandwidthUsage: 0,
      packetLoss: 0,
      congestionWindow: 0,
      activeStreams: 0,
    });
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const getStatusColor = () => {
    if (isConnecting) return "bg-yellow-500";
    if (isConnected) return "bg-green-500";
    return "bg-red-500";
  };

  const getStatusText = () => {
    if (isConnecting) return "Connecting...";
    if (isConnected) return "Connected";
    return "Disconnected";
  };
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">WebTransport</h1>
        {!checkWebTransportSupport() && (
          <Badge variant="destructive">Not Supported</Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>WebTransport Connection</CardTitle>
            <CardDescription>
              Connect to WebTransport servers for modern web protocols
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Server URL</label>
                <Input 
                  placeholder="https://example.com:4433/webtransport" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isConnected || isConnecting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Certificate Hash (Optional)
                </label>
                <Input 
                  placeholder="Base64 encoded certificate hash for self-signed certs" 
                  value={certificateHash}
                  onChange={(e) => setCertificateHash(e.target.value)}
                  disabled={isConnected || isConnecting}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={connect} 
                  disabled={isConnected || isConnecting || !checkWebTransportSupport()}
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={disconnect}
                  disabled={!isConnected}
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
              Monitor WebTransport connection health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${getStatusColor()}`}></div>
                <span className="text-sm">{getStatusText()}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Protocol: HTTP/3 + WebTransport</p>
                <p>Streams: {stats.streamsCreated} created, {stats.activeStreams} active</p>
                <p>Datagrams sent: {stats.datagramsSent}</p>
                <p>Datagrams received: {stats.datagramsReceived}</p>
                <p>RTT: {stats.rtt ? `${stats.rtt}ms` : "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stream Communication</CardTitle>
            <CardDescription>
              Send and receive data over WebTransport streams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stream Type</label>
                <Select value={streamType} onValueChange={setStreamType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bidirectional">
                      Bidirectional Stream
                    </SelectItem>
                    <SelectItem value="unidirectional">
                      Unidirectional Stream
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message Data</label>
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder='{"type": "message", "data": "Hello WebTransport!"}'
                  value={streamMessage}
                  onChange={(e) => setStreamMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={sendViaStream}
                  disabled={!isConnected}
                >
                  Send via Stream
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datagram Communication</CardTitle>
            <CardDescription>
              Send unreliable but fast datagrams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Datagram Data</label>
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder='{"type": "ping", "timestamp": 1234567890}'
                  value={datagramMessage}
                  onChange={(e) => setDatagramMessage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Send Rate (per second)
                </label>
                <Input 
                  placeholder="10" 
                  type="number" 
                  value={sendRate}
                  onChange={(e) => setSendRate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={sendDatagram}
                  disabled={!isConnected}
                >
                  Send Datagram
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={intervalRef.current ? stopBurst : startBurst}
                  disabled={!isConnected}
                >
                  {intervalRef.current ? "Stop Burst" : "Start Burst"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Message History</CardTitle>
            <CardDescription>
              Real-time display of WebTransport messages and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[300px] max-h-[400px] overflow-y-auto rounded-md border p-4 bg-muted font-mono text-sm">
                {messages.length === 0 ? (
                  <p className="text-muted-foreground">
                    Connect to a WebTransport server to see messages here...
                  </p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="mb-2 last:mb-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                        <Badge 
                          variant={message.direction === "sent" ? "default" : "secondary"}
                          className="text-xs px-1 py-0"
                        >
                          {message.direction}
                        </Badge>
                        <Badge 
                          variant={
                            message.type === "error" ? "destructive" :
                            message.type === "system" ? "outline" : "secondary"
                          }
                          className="text-xs px-1 py-0"
                        >
                          {message.type}
                        </Badge>
                      </div>
                      <div className={
                        message.type === "error" ? "text-red-400" :
                        message.type === "system" ? "text-blue-400" :
                        message.direction === "sent" ? "text-green-400" : "text-white"
                      }>
                        {message.data}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  Clear History
                </Button>
                <Button variant="outline" size="sm" onClick={exportMessages}>
                  Export Messages
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection Settings</CardTitle>
            <CardDescription>
              Configure WebTransport connection parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Max Concurrent Streams
                </label>
                <Input 
                  placeholder="100" 
                  type="number" 
                  value={maxStreams}
                  onChange={(e) => setMaxStreams(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Connection Timeout (ms)
                </label>
                <Input 
                  placeholder="30000" 
                  type="number" 
                  value={connectionTimeout}
                  onChange={(e) => setConnectionTimeout(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="keep-alive" 
                  checked={keepAlive}
                  onChange={(e) => setKeepAlive(e.target.checked)}
                />
                <label htmlFor="keep-alive" className="text-sm">
                  Enable keep-alive
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="auto-reconnect" 
                  checked={autoReconnect}
                  onChange={(e) => setAutoReconnect(e.target.checked)}
                />
                <label htmlFor="auto-reconnect" className="text-sm">
                  Auto-reconnect on failure
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="congestion-control" 
                  checked={congestionControl}
                  onChange={(e) => setCongestionControl(e.target.checked)}
                />
                <label htmlFor="congestion-control" className="text-sm">
                  Advanced congestion control
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Monitor WebTransport performance characteristics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Bandwidth Usage:</span>
                  <span className="font-mono">{stats.bandwidthUsage} KB/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Round Trip Time:</span>
                  <span className="font-mono">{stats.rtt ? `${stats.rtt} ms` : "- ms"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packet Loss:</span>
                  <span className="font-mono">{stats.packetLoss} %</span>
                </div>
                <div className="flex justify-between">
                  <span>Congestion Window:</span>
                  <span className="font-mono">{stats.congestionWindow} bytes</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Streams:</span>
                  <span className="font-mono">{stats.activeStreams}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" size="sm" onClick={resetMetrics}>
                Reset Metrics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
