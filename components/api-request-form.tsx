'use client';

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

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  responseTime: number;
  contentLength: string | number;
}

interface RequestStatus {
  loading: boolean;
  error: string | null;
  response: ApiResponse | null;
}

interface ApiRequestFormProps {
  initialUrl?: string;
  initialMethod?: string;
  initialHeaders?: string;
  initialRequestBody?: string;
}

export const ApiRequestForm = ({
  initialUrl = 'https://jsonplaceholder.typicode.com/posts',
  initialMethod = 'GET',
  initialHeaders = 'Content-Type: application/json',
  initialRequestBody = '',
}: ApiRequestFormProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>(initialMethod);
  const [url, setUrl] = useState<string>(initialUrl);
  const [headers, setHeaders] = useState<string>(initialHeaders);
  const [requestBody, setRequestBody] = useState<string>(initialRequestBody);
  const [status, setStatus] = useState<RequestStatus>({
    loading: false,
    error: null,
    response: null,
  });

  const handleSendRequest = async () => {
    setStatus({ loading: true, error: null, response: null });

    try {
      const response = await fetch('/api/basic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          method: selectedMethod,
          headers,
          requestBody: requestBody || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Request failed');
      }

      setStatus({
        loading: false,
        error: null,
        response: result,
      });
    } catch (error) {
      setStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: null,
      });
    }
  };

  const formatJson = (data: unknown) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-start">
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
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">HTTP Method</label>
              <div className="flex gap-2">
                <Button
                  variant={selectedMethod === 'GET' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMethod('GET')}
                >
                  GET
                </Button>
                <Button
                  variant={selectedMethod === 'POST' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMethod('POST')}
                >
                  POST
                </Button>
                <Button
                  variant={selectedMethod === 'PUT' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMethod('PUT')}
                >
                  PUT
                </Button>
                <Button
                  variant={selectedMethod === 'DELETE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMethod('DELETE')}
                >
                  DELETE
                </Button>
                <Button
                  variant={selectedMethod === 'PATCH' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMethod('PATCH')}
                >
                  PATCH
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Headers</label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Content-Type: application/json&#10;Authorization: Bearer your-token"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Request Body</label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder='{"title": "Test Post", "body": "This is a test", "userId": 1}'
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSendRequest}
              disabled={status.loading}
            >
              {status.loading ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col space-y-4 h-full">
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
                <div
                  className={`h-2 w-2 rounded-full ${
                    status.loading
                      ? 'bg-yellow-500'
                      : status.error
                        ? 'bg-red-500'
                        : status.response
                          ? 'bg-green-500'
                          : 'bg-gray-500'
                  }`}
                ></div>
                <span className="text-sm">
                  {status.loading
                    ? 'Loading...'
                    : status.error
                      ? 'Error'
                      : status.response
                        ? 'Success'
                        : 'Ready'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Status Code: {status.response?.status || '-'}</p>
                <p>
                  Response Time:{' '}
                  {status.response?.responseTime
                    ? `${status.response.responseTime}ms`
                    : '-'}
                </p>
                <p>Content Length: {status.response?.contentLength || '-'}</p>
                {status.error && (
                  <p className="text-red-500">Error: {status.error}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Response Headers</CardTitle>
            <CardDescription>
              View the HTTP response headers from the API
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="max-h-[220px] rounded-md border p-4 bg-muted font-mono text-xs overflow-auto">
              {status.response ? (
                <pre className="whitespace-pre-wrap">
                  {Object.entries(status.response.headers)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')}
                </pre>
              ) : (
                <p className="text-muted-foreground">
                  Headers will appear here after sending a request...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Response Body</CardTitle>
          <CardDescription>
            View the formatted API response data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px] max-h-[600px] rounded-md border p-4 bg-muted font-mono text-sm overflow-auto">
            {status.response ? (
              <pre className="whitespace-pre-wrap">
                {formatJson(status.response.data)}
              </pre>
            ) : status.error ? (
              <p className="text-red-500">{status.error}</p>
            ) : (
              <p className="text-muted-foreground">
                Response body will appear here after sending a request...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
