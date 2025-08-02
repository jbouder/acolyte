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

export default function WebScraperPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Web Scraper</h1>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scrape Configuration</CardTitle>
            <CardDescription>
              Configure your web scraping parameters and selectors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target URL</label>
                <Input placeholder="https://example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CSS Selector</label>
                <Input placeholder="h1, .title, #content" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">User Agent</label>
                <Select defaultValue="default">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Browser</SelectItem>
                    <SelectItem value="chrome">Chrome Desktop</SelectItem>
                    <SelectItem value="firefox">Firefox Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile Chrome</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Start Scraping</Button>
                <Button variant="outline" className="flex-1">
                  Preview
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scraping Status</CardTitle>
            <CardDescription>
              Monitor your web scraping progress and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                <span className="text-sm">Ready to scrape</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Elements found: -</p>
                <p>Success rate: -</p>
                <p>Total time: -</p>
                <p>Data points: -</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Scraped Data</CardTitle>
            <CardDescription>
              View and export your scraped web data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[300px] rounded-md border p-4 bg-muted font-mono text-sm">
                <p className="text-muted-foreground">
                  Scraped data will appear here...
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Export JSON
                </Button>
                <Button variant="outline" size="sm">
                  Export CSV
                </Button>
                <Button variant="outline" size="sm">
                  Copy Data
                </Button>
                <Button variant="outline" size="sm">
                  Clear Results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Options</CardTitle>
            <CardDescription>
              Configure advanced scraping settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Request Delay (ms)
                </label>
                <Input placeholder="1000" type="number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Requests</label>
                <Input placeholder="100" type="number" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="follow-redirects" defaultChecked />
                <label htmlFor="follow-redirects" className="text-sm">
                  Follow redirects
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ignore-robots" />
                <label htmlFor="ignore-robots" className="text-sm">
                  Ignore robots.txt
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="javascript" />
                <label htmlFor="javascript" className="text-sm">
                  Execute JavaScript
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Selectors</CardTitle>
            <CardDescription>
              Quick access to common CSS selectors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-left text-xs"
              >
                h1, h2, h3 - All headings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left text-xs"
              >
                a[href] - All links
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left text-xs"
              >
                img[src] - All images
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left text-xs"
              >
                p - All paragraphs
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left text-xs"
              >
                .price, .cost - Price elements
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left text-xs"
              >
                table tr td - Table data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
