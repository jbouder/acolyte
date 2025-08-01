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

export default function Base64Page() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Base64 Encoder/Decoder</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Encode to Base64</CardTitle>
            <CardDescription>
              Convert plain text or binary data to Base64 format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Input Text</label>
                <textarea
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter your text here to encode to Base64..."
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Encode</Button>
                <Button variant="outline" className="flex-1">
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decode from Base64</CardTitle>
            <CardDescription>
              Convert Base64 encoded data back to plain text
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Base64 Input</label>
                <textarea
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter Base64 encoded text here to decode..."
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Decode</Button>
                <Button variant="outline" className="flex-1">
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>
              The result of your encoding or decoding operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[200px] rounded-md border p-4 bg-muted font-mono text-sm">
                <p className="text-muted-foreground">
                  Output will appear here...
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Copy to Clipboard
                </Button>
                <Button variant="outline" size="sm">
                  Download as File
                </Button>
                <Button variant="outline" size="sm">
                  Clear Output
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
            <CardDescription>
              Upload a file to encode it to Base64
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Drag and drop a file here, or click to select
                  </p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Supported file types: All file types</p>
                <p>Maximum file size: 10MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Encoding Options</CardTitle>
            <CardDescription>
              Configure encoding and decoding options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="url-safe" />
                <label htmlFor="url-safe" className="text-sm">
                  URL-safe encoding
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="line-breaks" defaultChecked />
                <label htmlFor="line-breaks" className="text-sm">
                  Insert line breaks (76 chars)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remove-padding" />
                <label htmlFor="remove-padding" className="text-sm">
                  Remove padding characters
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Character Encoding
                </label>
                <Select defaultValue="utf8">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utf8">UTF-8</SelectItem>
                    <SelectItem value="ascii">ASCII</SelectItem>
                    <SelectItem value="latin1">Latin-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
