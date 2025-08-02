import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function JWTPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">JWT Decoder</h1>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>JWT Token Input</CardTitle>
            <CardDescription>
              Paste your JWT token here to decode and inspect its contents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">JWT Token</label>
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Decode JWT</Button>
                <Button variant="outline" className="flex-1">
                  Clear
                </Button>
                <Button variant="outline" className="flex-1">
                  Generate Sample JWT
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Header</CardTitle>
            <CardDescription>
              JWT header contains metadata about the token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[200px] rounded-md border p-4 bg-muted font-mono text-sm">
                <p className="text-muted-foreground">
                  JWT header will appear here...
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Copy Header
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payload</CardTitle>
            <CardDescription>
              JWT payload contains the actual claims and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[200px] rounded-md border p-4 bg-muted font-mono text-sm">
                <p className="text-muted-foreground">
                  JWT payload will appear here...
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Copy Payload
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signature Verification</CardTitle>
            <CardDescription>
              Verify the JWT signature with a secret key
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Secret Key</label>
                <input
                  type="password"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter secret key for verification..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Algorithm</label>
                <Select defaultValue="HS256">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HS256">HS256</SelectItem>
                    <SelectItem value="HS384">HS384</SelectItem>
                    <SelectItem value="HS512">HS512</SelectItem>
                    <SelectItem value="RS256">RS256</SelectItem>
                    <SelectItem value="RS384">RS384</SelectItem>
                    <SelectItem value="RS512">RS512</SelectItem>
                    <SelectItem value="ES256">ES256</SelectItem>
                    <SelectItem value="ES384">ES384</SelectItem>
                    <SelectItem value="ES512">ES512</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full">Verify Signature</Button>
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                <span className="text-sm">Signature not verified</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Information</CardTitle>
            <CardDescription>
              Additional information about the JWT token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Token Type:</span>
                  <span className="text-sm text-muted-foreground">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Algorithm:</span>
                  <span className="text-sm text-muted-foreground">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Issued At:</span>
                  <span className="text-sm text-muted-foreground">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Expires At:</span>
                  <span className="text-sm text-muted-foreground">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Subject:</span>
                  <span className="text-sm text-muted-foreground">-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Issuer:</span>
                  <span className="text-sm text-muted-foreground">-</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                  <span className="text-sm">Token Status: Not decoded</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
