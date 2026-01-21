'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    SwaggerUIBundle?: (config: unknown) => void;
  }
}

export default function SwaggerViewerPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [isSwaggerLoaded, setIsSwaggerLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const swaggerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Swagger UI CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.20.0/swagger-ui.css';
    document.head.appendChild(link);

    // Load Swagger UI Bundle
    const script = document.createElement('script');
    script.src =
      'https://unpkg.com/swagger-ui-dist@5.20.0/swagger-ui-bundle.js';
    script.onload = () => {
      setIsSwaggerLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      toast.error('Invalid file type. Please upload a JSON file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      toast.success('File uploaded successfully!');
    };
    reader.onerror = () => {
      setError('Failed to read file');
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const renderSwaggerUI = () => {
    try {
      setError('');

      // Validate JSON
      const spec = JSON.parse(jsonInput);

      // Basic validation for OpenAPI/Swagger format
      if (!spec.openapi && !spec.swagger) {
        setError(
          'Invalid OpenAPI/Swagger format. The JSON must contain either "openapi" or "swagger" property.',
        );
        toast.error('Invalid OpenAPI/Swagger format');
        return;
      }

      if (!isSwaggerLoaded || !window.SwaggerUIBundle) {
        setError('Swagger UI is still loading. Please try again.');
        toast.error('Swagger UI is still loading');
        return;
      }

      // Clear previous Swagger UI instance
      if (swaggerContainerRef.current) {
        swaggerContainerRef.current.innerHTML = '';
      }

      // Initialize Swagger UI
      window.SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui-container',
        deepLinking: true,
        presets: [
          // @ts-expect-error SwaggerUIBundle presets
          window.SwaggerUIBundle.presets.apis,
          // @ts-expect-error SwaggerUIStandalonePreset
          window.SwaggerUIStandalonePreset,
        ],
        layout: 'StandaloneLayout',
      });

      toast.success('API documentation loaded successfully!');
    } catch (err) {
      setError('Invalid JSON: ' + (err as Error).message);
      toast.error('Failed to parse JSON');
    }
  };

  const clearAll = () => {
    setJsonInput('');
    setError('');
    if (swaggerContainerRef.current) {
      swaggerContainerRef.current.innerHTML = '';
    }
    toast.info('Cleared all fields');
  };

  const loadExample = () => {
    const exampleSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Sample API',
        description: 'A sample API to demonstrate Swagger Viewer',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'https://api.example.com/v1',
          description: 'Production server',
        },
      ],
      paths: {
        '/users': {
          get: {
            summary: 'Get all users',
            description: 'Returns a list of users',
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                          email: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            summary: 'Create a user',
            description: 'Creates a new user',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string' },
                    },
                    required: ['name', 'email'],
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'User created successfully',
              },
            },
          },
        },
        '/users/{id}': {
          get: {
            summary: 'Get a user by ID',
            description: 'Returns a single user',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'integer' },
              },
            ],
            responses: {
              '200': {
                description: 'Successful response',
              },
              '404': {
                description: 'User not found',
              },
            },
          },
        },
      },
    };

    setJsonInput(JSON.stringify(exampleSpec, null, 2));
    toast.success('Example loaded!');
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Swagger Viewer</h1>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>OpenAPI / Swagger Specification</CardTitle>
            <CardDescription>
              Paste your OpenAPI JSON or upload a file to visualize your API
              documentation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload JSON File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button onClick={loadExample} variant="outline">
                Load Example
              </Button>
              <Button onClick={renderSwaggerUI} disabled={!jsonInput}>
                Render API Docs
              </Button>
              <Button onClick={clearAll} variant="outline">
                Clear
              </Button>
            </div>

            <textarea
              placeholder="Paste your OpenAPI/Swagger JSON here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-64 p-3 text-sm font-mono bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            {jsonInput && (
              <div className="text-xs text-muted-foreground">
                Characters: {jsonInput.length} | Lines:{' '}
                {jsonInput.split('\n').length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
            <CardDescription>
              Interactive API documentation will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              id="swagger-ui-container"
              ref={swaggerContainerRef}
              className="swagger-ui-container"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
