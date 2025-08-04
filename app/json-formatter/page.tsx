'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

export default function JsonFormatterPage() {
  const [inputJson, setInputJson] = useState('');
  const [output, setOutput] = useState('');
  const [indentSize, setIndentSize] = useState('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [error, setError] = useState('');

  const formatJson = () => {
    try {
      setError('');
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(
        sortKeys ? sortObjectKeys(parsed) : parsed,
        null,
        parseInt(indentSize),
      );
      setOutput(formatted);
      toast.success('JSON formatted successfully!');
    } catch (err) {
      setError('Invalid JSON: ' + (err as Error).message);
      setOutput('');
      toast.error('Invalid JSON format');
    }
  };

  const minifyJson = () => {
    try {
      setError('');
      const parsed = JSON.parse(inputJson);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      toast.success('JSON minified successfully!');
    } catch (err) {
      setError('Invalid JSON: ' + (err as Error).message);
      setOutput('');
      toast.error('Invalid JSON format');
    }
  };

  const validateJson = () => {
    try {
      JSON.parse(inputJson);
      setError('');
      toast.success('Valid JSON!');
    } catch (err) {
      setError('Invalid JSON: ' + (err as Error).message);
      toast.error('Invalid JSON format');
    }
  };

  const sortObjectKeys = (obj: unknown): unknown => {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    } else if (obj !== null && typeof obj === 'object') {
      const sortedObj: Record<string, unknown> = {};
      Object.keys(obj as Record<string, unknown>)
        .sort()
        .forEach((key) => {
          sortedObj[key] = sortObjectKeys(
            (obj as Record<string, unknown>)[key],
          );
        });
      return sortedObj;
    }
    return obj;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const clearAll = () => {
    setInputJson('');
    setOutput('');
    setError('');
    toast.info('Cleared all fields');
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">JSON Formatter</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input JSON</CardTitle>
            <CardDescription>
              Paste your JSON here to format, minify, or validate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              placeholder="Paste your JSON here..."
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              className="w-full h-96 p-3 text-sm font-mono bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Indent:</label>
                <Select value={indentSize} onValueChange={setIndentSize}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sortKeys"
                  checked={sortKeys}
                  onChange={(e) => setSortKeys(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="sortKeys" className="text-sm font-medium">
                  Sort keys
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={formatJson} className="flex-1 sm:flex-none">
                Format
              </Button>
              <Button
                onClick={minifyJson}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Minify
              </Button>
              <Button
                onClick={validateJson}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Validate
              </Button>
              <Button
                onClick={clearAll}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Clear
              </Button>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>
              Formatted, minified, or validated JSON result
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <textarea
                value={output}
                readOnly
                className="w-full h-96 p-3 text-sm font-mono bg-muted border rounded-md resize-none focus:outline-none"
                placeholder="Output will appear here..."
              />
              {output && (
                <Button
                  onClick={() => copyToClipboard(output)}
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  Copy
                </Button>
              )}
            </div>

            {output && (
              <div className="text-xs text-muted-foreground">
                Characters: {output.length} | Lines: {output.split('\n').length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
