import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SSEPage() {
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
                <label className="text-sm font-medium">SSE Endpoint</label>
                <Input placeholder="https://example.com/events" />
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
              Monitor your SSE connection health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-sm">Disconnected</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Messages received: 0</p>
                <p>Connection time: 0s</p>
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
              <div className="min-h-[300px] rounded-md border p-4 bg-muted">
                <p className="text-sm text-muted-foreground">
                  Connect to an SSE endpoint to see events here...
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Clear
                </Button>
                <Button variant="outline" size="sm">
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SSE Server</CardTitle>
            <CardDescription>Create a test SSE endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Message Interval (ms)
                </label>
                <Input placeholder="1000" type="number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message Template</label>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder='{"timestamp": "{{timestamp}}", "message": "Hello"}'
                />
              </div>
              <Button className="w-full">Start Test Server</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Types</CardTitle>
            <CardDescription>Filter events by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="message" defaultChecked />
                <label htmlFor="message" className="text-sm">
                  message
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="data" defaultChecked />
                <label htmlFor="data" className="text-sm">
                  data
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="error" defaultChecked />
                <label htmlFor="error" className="text-sm">
                  error
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="open" defaultChecked />
                <label htmlFor="open" className="text-sm">
                  open
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
