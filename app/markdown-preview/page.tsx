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
import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function MarkdownPreviewPage() {
  const [markdown, setMarkdown] = useState(`# Welcome to Markdown Preview

This is a **markdown preview tool** that allows you to write and preview markdown in real-time.

## Features

- Live preview as you type
- Side-by-side editing and preview
- Copy formatted HTML to clipboard
- Import/export markdown files
- Support for all standard markdown syntax

### Code Example

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### Lists

1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3

- Unordered list item
- Another item
- Last item

### Links and Images

[Visit GitHub](https://github.com)

> This is a blockquote
> 
> It can span multiple lines

---

**Bold text**, *italic text*, and \`inline code\`.
`);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Markdown file downloaded!');
  };

  const uploadMarkdown = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      toast.error('Please select a .md or .txt file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setMarkdown(content);
      toast.success('File loaded successfully!');
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = '';
  };

  const clearAll = () => {
    setMarkdown('');
    toast.info('Cleared all content');
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Markdown Preview</h1>
        <div className="flex gap-2">
          <Button onClick={uploadMarkdown} variant="outline" size="sm">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button onClick={downloadMarkdown} variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => copyToClipboard(markdown)} variant="outline" size="sm">
            <Copy className="h-4 w-4" />
            Copy MD
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
              Markdown Editor
            </CardTitle>
            <CardDescription>
              Type or paste your Markdown content here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Type your Markdown here..."
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="min-h-[500px] font-mono text-sm resize-none"
            />
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Characters: {markdown.length.toLocaleString()}</span>
              <span>
                Lines: {markdown.split('\n').length.toLocaleString()}
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
              See how your Markdown will look when rendered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[500px] overflow-auto rounded-md border border-border bg-muted/30 p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{markdown}</ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".md,.txt"
        className="hidden"
      />
    </div>
  );
}