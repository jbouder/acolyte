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

export default function WebTransportPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">WebTransport</h1>
        <Badge>Coming Soon</Badge>
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
                <Input placeholder="https://example.com:4433/webtransport" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Certificate Hash (Optional)
                </label>
                <Input placeholder="Base64 encoded certificate hash for self-signed certs" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Connect</Button>
                <Button variant="outline" className="flex-1">
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
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-sm">Disconnected</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Protocol: HTTP/3 + WebTransport</p>
                <p>Streams: 0 bidirectional, 0 unidirectional</p>
                <p>Datagrams sent: 0</p>
                <p>Datagrams received: 0</p>
                <p>RTT: -</p>
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
                <Select defaultValue="bidirectional">
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
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Send via Stream</Button>
                <Button variant="outline" className="flex-1">
                  Create Stream
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
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Send Rate (per second)
                </label>
                <Input placeholder="10" type="number" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Send Datagram</Button>
                <Button variant="outline" className="flex-1">
                  Start Burst
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
              <div className="min-h-[300px] rounded-md border p-4 bg-muted font-mono text-sm">
                <p className="text-muted-foreground">
                  Connect to a WebTransport server to see messages here...
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Clear History
                </Button>
                <Button variant="outline" size="sm">
                  Export Messages
                </Button>
                <Button variant="outline" size="sm">
                  Filter by Type
                </Button>
                <Button variant="outline" size="sm">
                  Show Statistics
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
                <Input placeholder="100" type="number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Connection Timeout (ms)
                </label>
                <Input placeholder="30000" type="number" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="keep-alive" defaultChecked />
                <label htmlFor="keep-alive" className="text-sm">
                  Enable keep-alive
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="auto-reconnect" />
                <label htmlFor="auto-reconnect" className="text-sm">
                  Auto-reconnect on failure
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="congestion-control" defaultChecked />
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
                  <span className="font-mono">- KB/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Round Trip Time:</span>
                  <span className="font-mono">- ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Packet Loss:</span>
                  <span className="font-mono">- %</span>
                </div>
                <div className="flex justify-between">
                  <span>Congestion Window:</span>
                  <span className="font-mono">- bytes</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Streams:</span>
                  <span className="font-mono">-</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" size="sm">
                Reset Metrics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
