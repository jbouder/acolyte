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

export default function AccessibilityPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Accessibility Checker</h1>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>URL Analysis</CardTitle>
            <CardDescription>
              Analyze a website for accessibility compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Website URL</label>
                <Input placeholder="https://example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">WCAG Level</label>
                <Select defaultValue="AA">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">WCAG 2.1 Level A</SelectItem>
                    <SelectItem value="AA">WCAG 2.1 Level AA</SelectItem>
                    <SelectItem value="AAA">WCAG 2.1 Level AAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Analyze Website</Button>
                <Button variant="outline" className="flex-1">
                  Quick Scan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Status</CardTitle>
            <CardDescription>
              Current accessibility analysis progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                <span className="text-sm">Ready to analyze</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Issues found: -</p>
                <p>Warnings: -</p>
                <p>Passed tests: -</p>
                <p>Compliance score: -</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Accessibility Report</CardTitle>
            <CardDescription>
              Detailed accessibility issues and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[300px] rounded-md border p-4 bg-muted">
                <p className="text-sm text-muted-foreground">
                  Accessibility report will appear here...
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Export Report
                </Button>
                <Button variant="outline" size="sm">
                  Download PDF
                </Button>
                <Button variant="outline" size="sm">
                  Share Results
                </Button>
                <Button variant="outline" size="sm">
                  Print Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Color Contrast Checker</CardTitle>
            <CardDescription>
              Test color combinations for accessibility compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Foreground Color</label>
                <div className="flex gap-2">
                  <Input placeholder="#000000" className="flex-1" />
                  <div className="w-10 h-10 rounded border bg-black"></div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Background Color</label>
                <div className="flex gap-2">
                  <Input placeholder="#ffffff" className="flex-1" />
                  <div className="w-10 h-10 rounded border bg-white"></div>
                </div>
              </div>
              <Button className="w-full">Check Contrast</Button>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Contrast Ratio:</span>
                  <span className="font-mono">-</span>
                </div>
                <div className="flex justify-between">
                  <span>AA Normal:</span>
                  <span className="text-muted-foreground">-</span>
                </div>
                <div className="flex justify-between">
                  <span>AA Large:</span>
                  <span className="text-muted-foreground">-</span>
                </div>
                <div className="flex justify-between">
                  <span>AAA Normal:</span>
                  <span className="text-muted-foreground">-</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Tests</CardTitle>
            <CardDescription>
              Common accessibility checks and tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Check Alt Text
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Validate Headings Structure
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Test Keyboard Navigation
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Check ARIA Labels
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Validate Form Labels
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Test Focus Indicators
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
