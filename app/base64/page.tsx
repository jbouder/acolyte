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
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export default function Base64Page() {
  const [inputText, setInputText] = useState('');
  const [base64Input, setBase64Input] = useState('');
  const [output, setOutput] = useState('');
  const [isUrlSafe, setIsUrlSafe] = useState(false);
  const [addLineBreaks, setAddLineBreaks] = useState(true);
  const [removePadding, setRemovePadding] = useState(false);
  const [charEncoding, setCharEncoding] = useState('utf8');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const encodeToBase64 = () => {
    try {
      setError('');
      let encoded = btoa(inputText);

      if (isUrlSafe) {
        encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
      }

      if (removePadding) {
        encoded = encoded.replace(/=/g, '');
      }

      if (addLineBreaks) {
        encoded = encoded.match(/.{1,76}/g)?.join('\n') || encoded;
      }

      setOutput(encoded);
      toast.success('Text successfully encoded to Base64!');
    } catch {
      setError('Failed to encode text. Please check your input.');
    }
  };

  const decodeFromBase64 = () => {
    try {
      setError('');
      let input = base64Input.replace(/\n/g, '').replace(/\s/g, '');

      if (isUrlSafe) {
        input = input.replace(/-/g, '+').replace(/_/g, '/');
      }

      // Add padding if needed
      while (input.length % 4) {
        input += '=';
      }

      const decoded = atob(input);
      setOutput(decoded);
      toast.success('Base64 successfully decoded!');
    } catch {
      setError('Failed to decode Base64. Please check your input format.');
    }
  };

  const clearInput = () => {
    setInputText('');
    setError('');
  };

  const clearBase64Input = () => {
    setBase64Input('');
    setError('');
  };

  const clearOutput = () => {
    setOutput('');
    setError('');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadAsFile = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base64-output.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setError('');
        const result = e.target?.result;
        if (typeof result === 'string') {
          // For text files
          setInputText(result);
          toast.success(`Text file "${file.name}" loaded for encoding!`);
        } else if (result instanceof ArrayBuffer) {
          // For binary files
          const bytes = new Uint8Array(result);
          const binary = Array.from(bytes, (byte) =>
            String.fromCharCode(byte),
          ).join('');
          const encoded = btoa(binary);
          setOutput(encoded);
          toast.success(`File "${file.name}" encoded to Base64!`);
        }
      } catch {
        setError('Failed to process file');
      }
    };

    // Read as text first, fallback to binary if needed
    if (file.type.startsWith('text/')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Base64 Encoder/Decoder</h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Encode to Base64</CardTitle>
            <CardDescription>
              Convert plain text or binary data to Base64 format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Input Text</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter your text here to encode to Base64..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={encodeToBase64} className="flex-1">
                  Encode
                </Button>
                <Button
                  onClick={clearInput}
                  variant="outline"
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decode from Base64</CardTitle>
            <CardDescription>
              Convert Base64 encoded data back to plain text
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Base64 Input</label>
                <textarea
                  value={base64Input}
                  onChange={(e) => setBase64Input(e.target.value)}
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter Base64 encoded text here to decode..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={decodeFromBase64} className="flex-1">
                  Decode
                </Button>
                <Button
                  onClick={clearBase64Input}
                  variant="outline"
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>
              The result of your encoding or decoding operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="min-h-[200px] rounded-md border p-4 bg-muted font-mono text-sm whitespace-pre-wrap break-all">
                {output || (
                  <p className="text-muted-foreground">
                    Output will appear here...
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  disabled={!output}
                >
                  Copy to Clipboard
                </Button>
                <Button
                  onClick={downloadAsFile}
                  variant="outline"
                  size="sm"
                  disabled={!output}
                >
                  Download as File
                </Button>
                <Button
                  onClick={clearOutput}
                  variant="outline"
                  size="sm"
                  disabled={!output}
                >
                  Clear Output
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
            <CardDescription>
              Upload a file to encode it to Base64
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {isDragging
                      ? 'Drop the file here...'
                      : 'Drag and drop a file here, or click to select'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="*/*"
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Supported file types: All file types</p>
                <p>Maximum file size: 10MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Encoding Options</CardTitle>
            <CardDescription>
              Configure encoding and decoding options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="url-safe"
                  checked={isUrlSafe}
                  onChange={(e) => setIsUrlSafe(e.target.checked)}
                />
                <label htmlFor="url-safe" className="text-sm">
                  URL-safe encoding
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="line-breaks"
                  checked={addLineBreaks}
                  onChange={(e) => setAddLineBreaks(e.target.checked)}
                />
                <label htmlFor="line-breaks" className="text-sm">
                  Insert line breaks (76 chars)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remove-padding"
                  checked={removePadding}
                  onChange={(e) => setRemovePadding(e.target.checked)}
                />
                <label htmlFor="remove-padding" className="text-sm">
                  Remove padding characters
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Character Encoding
                </label>
                <Select value={charEncoding} onValueChange={setCharEncoding}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utf8">UTF-8</SelectItem>
                    <SelectItem value="ascii">ASCII</SelectItem>
                    <SelectItem value="latin1">Latin-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
