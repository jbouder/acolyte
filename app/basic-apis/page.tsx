import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BasicAPIsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Basic APIs</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>API Request</CardTitle>
            <CardDescription>
              Configure and send HTTP requests to any API endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input
                  placeholder="https://jsonplaceholder.typicode.com/posts"
                  defaultValue="https://jsonplaceholder.typicode.com/posts"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">HTTP Method</label>
                <div className="flex gap-2">
                  <Button variant="default" size="sm">
                    GET
                  </Button>
                  <Button variant="outline" size="sm">
                    POST
                  </Button>
                  <Button variant="outline" size="sm">
                    PUT
                  </Button>
                  <Button variant="outline" size="sm">
                    DELETE
                  </Button>
                  <Button variant="outline" size="sm">
                    PATCH
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Headers</label>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Content-Type: application/json&#10;Authorization: Bearer your-token"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Request Body</label>
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder='{"title": "Test Post", "body": "This is a test", "userId": 1}'
                />
              </div>
              <Button className="w-full">Send Request</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
            <CardDescription>
              Monitor your API request status and timing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                <span className="text-sm">Ready</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Status Code: -</p>
                <p>Response Time: -</p>
                <p>Content Length: -</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardDescription>
              View the formatted API response data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[300px] rounded-md border p-4 bg-muted font-mono text-sm">
                <p className="text-muted-foreground">
                  Send a request to see the response here...
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Copy Response
                </Button>
                <Button variant="outline" size="sm">
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  Format JSON
                </Button>
                <Button variant="outline" size="sm">
                  View Headers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
