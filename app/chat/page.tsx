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

export default function ChatPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chat Interface</h1>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Chat Messages</CardTitle>
            <CardDescription>
              Real-time chat interface for testing and communication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[400px] rounded-md border p-4 bg-muted/50 overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex justify-start">
                    <div className="bg-blue-500 text-white rounded-lg px-3 py-2 max-w-xs">
                      <p className="text-sm">Welcome to the chat interface!</p>
                      <span className="text-xs opacity-75">10:30 AM</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-gray-200 text-gray-800 rounded-lg px-3 py-2 max-w-xs">
                      <p className="text-sm">
                        This looks great for testing chat features.
                      </p>
                      <span className="text-xs opacity-75">10:31 AM</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">
                      Start typing to add messages...
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message here..."
                  className="flex-1"
                />
                <Button>Send</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat Settings</CardTitle>
            <CardDescription>
              Configure chat behavior and appearance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input placeholder="Your name" defaultValue="User" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chat Room</label>
                <Input placeholder="General" defaultValue="General" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message Theme</label>
                <Select defaultValue="default">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="dark">Dark Mode</SelectItem>
                    <SelectItem value="colorful">Colorful</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="timestamps" defaultChecked />
                <label htmlFor="timestamps" className="text-sm">
                  Show timestamps
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="notifications" defaultChecked />
                <label htmlFor="notifications" className="text-sm">
                  Enable notifications
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="typing-indicator" defaultChecked />
                <label htmlFor="typing-indicator" className="text-sm">
                  Typing indicators
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              Monitor chat connection and server status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Connected</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Server: chat.example.com</p>
                  <p>Protocol: WebSocket</p>
                  <p>Latency: 45ms</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Active Users</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Alice (typing...)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Bob</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <span>Charlie (away)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat Actions</CardTitle>
            <CardDescription>Quick actions and utilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Clear Chat History
              </Button>
              <Button variant="outline" className="w-full">
                Export Messages
              </Button>
              <Button variant="outline" className="w-full">
                Share Chat Link
              </Button>
              <Button variant="outline" className="w-full">
                Create Private Room
              </Button>
              <Button variant="outline" className="w-full">
                Invite Users
              </Button>
              <Button variant="outline" className="w-full">
                Report Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
