'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';

interface WebStats {
  url: string;
  domain: string;
  protocol: string;
  statusCode: number;
  statusText: string;
  responseTime: number;
  timestamp: string;
  content: {
    title: string;
    description: string;
    contentLength: number;
    htmlSizeKB: number;
    wordCount: number;
    charCount: number;
    linkCount: number;
    imageCount: number;
    scriptCount: number;
    styleCount: number;
    cssLinkCount: number;
  };
  headers: Record<string, string>;
  securityHeaders: Record<string, string | null>;
  frameworks: Record<string, boolean>;
  metaTags: Array<{ name: string; content: string }>;
  performance: {
    responseTimeMs: number;
    contentLengthBytes: number;
    compressionRatio: string;
  };
}

export default function WebStatsPage() {
  const [url, setUrl] = useState('https://example.com');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<WebStats | null>(null);
  const [error, setError] = useState('');

  const analyzeWebsite = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setStats(null);

    try {
      const response = await fetch('/api/web-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze website');
      }

      setStats(data);
      toast.success('Website analysis completed!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to analyze website';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const exportStats = () => {
    if (!stats) return;

    const dataStr = JSON.stringify(stats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `web-stats-${stats.domain}-${
      new Date().toISOString().split('T')[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Stats exported!');
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-500';
    if (statusCode >= 300 && statusCode < 400) return 'bg-yellow-500';
    if (statusCode >= 400 && statusCode < 500) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPerformanceColor = (responseTime: number) => {
    if (responseTime < 500) return 'text-green-600';
    if (responseTime < 1000) return 'text-yellow-600';
    if (responseTime < 2000) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Website Analysis</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website URL</CardTitle>
          <CardDescription>
            Enter a URL to get detailed statistics and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && analyzeWebsite()}
              />
              <Button onClick={analyzeWebsite} disabled={loading}>
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${getStatusColor(
                      stats.statusCode,
                    )}`}
                  ></div>
                  <span className="font-mono text-lg">{stats.statusCode}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.statusText}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-lg ${getPerformanceColor(
                      stats.responseTime,
                    )}`}
                  >
                    {stats.responseTime}ms
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Page Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg">
                    {stats.content.htmlSizeKB} KB
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Protocol</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg">
                    {stats.protocol.replace(':', '').toUpperCase()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Page Information</CardTitle>
                <CardDescription>
                  Basic information about the webpage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm bg-muted p-2 rounded flex-1 break-words">
                      {stats.content.title}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(stats.content.title, 'Title')
                      }
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <div className="flex items-start gap-2">
                    <p className="text-sm bg-muted p-2 rounded flex-1 break-words">
                      {stats.content.description}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(
                          stats.content.description,
                          'Description',
                        )
                      }
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Word Count:</span>{' '}
                    {stats.content.wordCount.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Character Count:</span>{' '}
                    {stats.content.charCount.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Links:</span>{' '}
                    {stats.content.linkCount}
                  </div>
                  <div>
                    <span className="font-medium">Images:</span>{' '}
                    {stats.content.imageCount}
                  </div>
                  <div>
                    <span className="font-medium">Scripts:</span>{' '}
                    {stats.content.scriptCount}
                  </div>
                  <div>
                    <span className="font-medium">CSS Files:</span>{' '}
                    {stats.content.cssLinkCount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Headers</CardTitle>
                <CardDescription>Security-related HTTP headers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.securityHeaders).map(
                    ([header, value]) => (
                      <div
                        key={header}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-mono">{header}</span>
                        <Badge variant={value ? 'default' : 'destructive'}>
                          {value ? 'Present' : 'Missing'}
                        </Badge>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Detected Frameworks</CardTitle>
                <CardDescription>
                  Frameworks, libraries, CMS platforms, and technologies
                  detected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.frameworks).map(
                    ([framework, detected]) => (
                      <Badge
                        key={framework}
                        variant={detected ? 'default' : 'secondary'}
                        className={detected ? 'bg-green-500' : ''}
                      >
                        {framework.charAt(0).toUpperCase() + framework.slice(1)}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Website performance information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Response Time:</span>
                  <span
                    className={`text-sm font-mono ${getPerformanceColor(
                      stats.performance.responseTimeMs,
                    )}`}
                  >
                    {stats.performance.responseTimeMs}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Content Size:</span>
                  <span className="text-sm font-mono">
                    {(stats.performance.contentLengthBytes / 1024).toFixed(2)}{' '}
                    KB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Compression:</span>
                  <span className="text-sm">
                    {stats.performance.compressionRatio}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Analyzed:</span>
                  <span className="text-sm">
                    {new Date(stats.timestamp).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats.metaTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Meta Tags</CardTitle>
                <CardDescription>
                  Key meta tags found on the page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {stats.metaTags.map((tag, index) => (
                    <div
                      key={index}
                      className="border border-border rounded p-2 bg-muted/50"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-mono text-blue-600 min-w-0 break-all">
                          {tag.name}:
                        </span>
                        <span className="text-xs break-words flex-1">
                          {tag.content}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>HTTP Headers</CardTitle>
              <CardDescription>
                Response headers from the server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(stats.headers).map(([header, value]) => (
                  <div
                    key={header}
                    className="border border-border rounded p-2 bg-muted/50"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono text-blue-600 min-w-0">
                        {header}:
                      </span>
                      <span className="text-xs break-all flex-1">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={exportStats} variant="outline">
              Export Results
            </Button>
            <Button
              onClick={() =>
                copyToClipboard(JSON.stringify(stats, null, 2), 'Full stats')
              }
              variant="outline"
            >
              Copy JSON
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
