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
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  wcagLevel?: string;
  wcagCriteria?: string;
}

interface AccessibilityReport {
  url: string;
  timestamp: string;
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    info: number;
  };
  issues: AccessibilityIssue[];
  checks: {
    hasLang: boolean;
    hasTitle: boolean;
    hasMetaViewport: boolean;
    hasSkipLink: boolean;
    hasAltTexts: boolean;
    hasFormLabels: boolean;
    hasHeadingStructure: boolean;
    hasAriaLabels: boolean;
    hasLandmarks: boolean;
    hasColorContrast: boolean;
  };
}

export default function AccessibilityCheckerPage() {
  const [url, setUrl] = useState('https://example.com');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [error, setError] = useState('');

  const checkAccessibility = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const response = await fetch('/api/accessibility-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check accessibility');
      }

      setReport(data);

      if (data.summary.errors > 0) {
        toast.error(`Found ${data.summary.errors} accessibility errors`);
      } else if (data.summary.warnings > 0) {
        toast.warning(`Found ${data.summary.warnings} accessibility warnings`);
      } else {
        toast.success('No critical accessibility issues found!');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to check accessibility';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!report) return;

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const domain = new URL(report.url).hostname;
    link.download = `accessibility-report-${domain}-${
      new Date().toISOString().split('T')[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Accessibility Checker</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website URL</CardTitle>
          <CardDescription>
            Enter a URL to scan for accessibility issues and WCAG compliance
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
                onKeyDown={(e) => e.key === 'Enter' && checkAccessibility()}
              />
              <Button onClick={checkAccessibility} disabled={loading}>
                {loading ? 'Scanning...' : 'Scan'}
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

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {report.summary.totalIssues}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total Issues
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {report.summary.errors}
                    </div>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {report.summary.warnings}
                    </div>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {report.summary.info}
                    </div>
                    <p className="text-xs text-muted-foreground">Info Items</p>
                  </div>
                  <Info className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accessibility Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Checks</CardTitle>
              <CardDescription>
                Essential accessibility features and best practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(report.checks).map(([check, passed]) => (
                  <div
                    key={check}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">
                      {check
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase())}
                    </span>
                    <Badge variant={passed ? 'default' : 'destructive'}>
                      {passed ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          {report.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Issues Found</CardTitle>
                <CardDescription>
                  Accessibility issues detected on the page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getIssueColor(issue.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{issue.message}</p>
                          {issue.element && (
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                              Element: {issue.element}
                            </p>
                          )}
                          {issue.wcagCriteria && (
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {issue.wcagCriteria}
                              </Badge>
                              {issue.wcagLevel && (
                                <Badge variant="outline" className="text-xs">
                                  WCAG {issue.wcagLevel}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {report.issues.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Critical Issues Found!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This page appears to follow accessibility best practices.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button onClick={exportReport} variant="outline">
              Export Report
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
