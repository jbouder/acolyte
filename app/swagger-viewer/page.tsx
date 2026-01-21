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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface OpenAPIEndpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  tags: string[];
}

interface ParsedAPI {
  title: string;
  version: string;
  description: string;
  endpoints: OpenAPIEndpoint[];
}

const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'options',
  'head',
]);

export default function SwaggerViewerPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [parsedAPI, setParsedAPI] = useState<ParsedAPI | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const parseOpenAPI = (spec: Record<string, unknown>): ParsedAPI => {
    const endpoints: OpenAPIEndpoint[] = [];
    const paths = spec.paths;
    const info = spec.info;

    // Validate paths exists and is an object
    if (!paths || typeof paths !== 'object' || Array.isArray(paths)) {
      throw new Error('No paths found in OpenAPI specification');
    }

    Object.entries(paths).forEach(([path, pathItem]) => {
      if (typeof pathItem !== 'object' || pathItem === null) return;

      const methods = pathItem as Record<string, unknown>;
      Object.entries(methods).forEach(([method, operation]) => {
        if (
          typeof operation === 'object' &&
          operation !== null &&
          HTTP_METHODS.has(method.toLowerCase())
        ) {
          const op = operation as Record<string, unknown>;
          // Safely handle tags - ensure it's an array
          const tags = Array.isArray(op.tags) ? op.tags : ['default'];

          endpoints.push({
            method: method.toUpperCase(),
            path,
            summary: (op.summary as string) || '',
            description: (op.description as string) || '',
            tags,
          });
        }
      });
    });

    // Safely extract info properties
    const infoObj =
      info && typeof info === 'object' && !Array.isArray(info)
        ? (info as Record<string, unknown>)
        : {};

    return {
      title: (infoObj.title as string) || 'API Documentation',
      version: (infoObj.version as string) || '1.0.0',
      description: (infoObj.description as string) || '',
      endpoints,
    };
  };

  const renderAPIDocumentation = () => {
    try {
      setError('');
      setParsedAPI(null);

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

      const parsed = parseOpenAPI(spec);
      setParsedAPI(parsed);
      toast.success('API documentation parsed successfully!');
    } catch (err) {
      setError('Invalid JSON: ' + (err as Error).message);
      toast.error('Failed to parse JSON');
    }
  };

  const clearAll = () => {
    setJsonInput('');
    setError('');
    setParsedAPI(null);
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
            tags: ['Users'],
            responses: {
              '200': {
                description: 'Successful response',
              },
            },
          },
          post: {
            summary: 'Create a user',
            description: 'Creates a new user',
            tags: ['Users'],
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
            tags: ['Users'],
            responses: {
              '200': {
                description: 'Successful response',
              },
            },
          },
          delete: {
            summary: 'Delete a user',
            description: 'Deletes a user by ID',
            tags: ['Users'],
            responses: {
              '204': {
                description: 'User deleted successfully',
              },
            },
          },
        },
        '/products': {
          get: {
            summary: 'Get all products',
            description: 'Returns a list of products',
            tags: ['Products'],
            responses: {
              '200': {
                description: 'Successful response',
              },
            },
          },
          post: {
            summary: 'Create a product',
            description: 'Creates a new product',
            tags: ['Products'],
            responses: {
              '201': {
                description: 'Product created successfully',
              },
            },
          },
        },
      },
    };

    setJsonInput(JSON.stringify(exampleSpec, null, 2));
    toast.success('Example loaded!');
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-500',
      POST: 'bg-green-500',
      PUT: 'bg-yellow-500',
      DELETE: 'bg-red-500',
      PATCH: 'bg-purple-500',
      OPTIONS: 'bg-gray-500',
      HEAD: 'bg-cyan-500',
    };
    return colors[method] || 'bg-gray-500';
  };

  const groupEndpointsByTag = (endpoints: OpenAPIEndpoint[]) => {
    const grouped: Record<string, OpenAPIEndpoint[]> = {};
    endpoints.forEach((endpoint) => {
      // Use only the first tag to avoid duplicates
      const primaryTag = endpoint.tags[0] || 'default';
      if (!grouped[primaryTag]) {
        grouped[primaryTag] = [];
      }
      grouped[primaryTag].push(endpoint);
    });
    return grouped;
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
              Paste your OpenAPI JSON or upload a file to view your API
              endpoints in a readable format
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
              <Button onClick={renderAPIDocumentation} disabled={!jsonInput}>
                Parse API Docs
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

        {parsedAPI && (
          <Card>
            <CardHeader>
              <CardTitle>{parsedAPI.title}</CardTitle>
              <CardDescription>
                {parsedAPI.description && (
                  <span className="block mb-2">{parsedAPI.description}</span>
                )}
                <span className="text-xs">Version: {parsedAPI.version}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupEndpointsByTag(parsedAPI.endpoints)).map(
                ([tag, endpoints]) => (
                  <div key={tag} className="space-y-3">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      {tag}
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Method</TableHead>
                          <TableHead className="w-1/3">Endpoint</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {endpoints.map((endpoint) => (
                          <TableRow key={`${endpoint.method}-${endpoint.path}`}>
                            <TableCell>
                              <Badge
                                className={`${getMethodColor(endpoint.method)} text-white font-mono`}
                              >
                                {endpoint.method}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {endpoint.path}
                            </TableCell>
                            <TableCell>
                              {endpoint.summary || endpoint.description || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ),
              )}

              {parsedAPI.endpoints.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No endpoints found in the API specification.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
