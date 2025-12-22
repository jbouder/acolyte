'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Eye, FileText, Upload } from 'lucide-react';
import mermaid from 'mermaid';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function MermaidViewerPage() {
  const [mermaidCode, setMermaidCode] = useState(`graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`);

  const [renderKey, setRenderKey] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'strict',
    });
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const renderDiagram = async () => {
      if (!previewRef.current) return;

      // Don't attempt to render if mermaidCode is empty or only whitespace
      if (!mermaidCode.trim()) {
        previewRef.current.innerHTML = '';
        return;
      }

      try {
        previewRef.current.innerHTML = '';
        const { svg } = await mermaid.render(
          `mermaid-diagram-${renderKey}`,
          mermaidCode,
        );
        previewRef.current.innerHTML = svg;
      } catch (error) {
        previewRef.current.innerHTML = `<div class="text-destructive p-4">
          <p class="font-semibold mb-2">Invalid Mermaid Syntax</p>
          <p class="text-sm">${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>`;
      }
    };

    renderDiagram();
  }, [mermaidCode, renderKey, isInitialized]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadMermaid = () => {
    const blob = new Blob([mermaidCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.mmd';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Mermaid file downloaded!');
  };

  const uploadMermaid = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !file.name.endsWith('.mmd') &&
      !file.name.endsWith('.mermaid') &&
      !file.name.endsWith('.txt')
    ) {
      toast.error('Please select a .mmd, .mermaid, or .txt file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setMermaidCode(content);
      setRenderKey((prev) => prev + 1);
      toast.success('File loaded successfully!');
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = '';
  };

  const clearAll = () => {
    setMermaidCode('');
    toast.info('Cleared all content');
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mermaid Preview</h1>
        <div className="flex gap-2">
          <Button onClick={uploadMermaid} variant="outline" size="sm">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button onClick={downloadMermaid} variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => copyToClipboard(mermaidCode)}
            variant="outline"
            size="sm"
          >
            <Copy className="h-4 w-4" />
            Copy Code
          </Button>
          <Button onClick={clearAll} variant="outline" size="sm">
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Mermaid Editor
            </CardTitle>
            <CardDescription>
              Type or paste your Mermaid diagram code here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Type your Mermaid code here..."
              value={mermaidCode}
              onChange={(e) => setMermaidCode(e.target.value)}
              className="min-h-[500px] font-mono text-sm resize-none"
            />
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Characters: {mermaidCode.length.toLocaleString()}</span>
              <span>
                Lines: {mermaidCode.split('\n').length.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
            </CardTitle>
            <CardDescription>
              See how your Mermaid diagram will be rendered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[500px] overflow-auto rounded-md border border-border bg-muted/30 p-4 flex items-center justify-center">
              <div ref={previewRef} className="w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".mmd,.mermaid,.txt"
        className="hidden"
      />
    </div>
  );
}
