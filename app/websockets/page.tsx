import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function WebSocketsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">WebSockets</h1>
        <Badge variant="secondary">Coming Soon</Badge>
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
                  placeholder="wss://echo.websocket.org"
                  defaultValue="wss://echo.websocket.org"
                />
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
              Monitor your WebSocket connection health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-sm">Disconnected</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Messages sent: 0</p>
                <p>Messages received: 0</p>
                <p>Connection time: 0s</p>
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
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder='{"type": "message", "data": "Hello WebSocket!"}'
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Send Message</Button>
                <Button variant="outline" className="flex-1">
                  Send Ping
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message Templates</CardTitle>
            <CardDescription>
              Quick templates for common WebSocket messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-left"
              >
                {'{ "type": "ping" }'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left"
              >
                {'{ "type": "subscribe", "channel": "updates" }'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left"
              >
                {'{ "type": "auth", "token": "your-token" }'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left"
              >
                {'{ "type": "chat", "message": "Hello!" }'}
              </Button>
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
              <div className="min-h-[300px] rounded-md border p-4 bg-muted">
                <p className="text-sm text-muted-foreground">
                  Connect to a WebSocket to see messages here...
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
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  Auto-scroll
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
                <Input placeholder="chat, superchat" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Headers</label>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Authorization: Bearer token&#10;Origin: https://example.com"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="auto-reconnect" />
                <label htmlFor="auto-reconnect" className="text-sm">
                  Auto-reconnect
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WebSocket Server</CardTitle>
            <CardDescription>
              Create a test WebSocket server endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Server Port</label>
                <Input placeholder="8080" type="number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Echo Mode</label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="echo-mode" defaultChecked />
                  <label htmlFor="echo-mode" className="text-sm">
                    Echo received messages
                  </label>
                </div>
              </div>
              <Button className="w-full">Start Test Server</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
