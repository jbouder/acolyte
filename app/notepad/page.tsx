"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, Save, Trash2, FileText } from "lucide-react";

const STORAGE_KEY = "web-tools-notepad-content";

export default function NotepadPage() {
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load content from localStorage on component mount
  useEffect(() => {
    const savedContent = localStorage.getItem(STORAGE_KEY);
    if (savedContent) {
      try {
        const parsed = JSON.parse(savedContent);
        setContent(parsed.content || "");
        setLastSaved(parsed.lastSaved ? new Date(parsed.lastSaved) : null);
      } catch {
        // Fallback for legacy string storage
        setContent(savedContent);
      }
    }
  }, []);

  // Auto-save to localStorage with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!content.trim()) return;

      setIsAutoSaving(true);
      const saveData = {
        content,
        lastSaved: new Date().toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      setLastSaved(new Date());
      setIsAutoSaving(false);
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [content]);

  // Save content to localStorage
  const saveToLocalStorage = () => {
    if (!content.trim()) return;

    setIsAutoSaving(true);
    const saveData = {
      content,
      lastSaved: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    setLastSaved(new Date());
    setIsAutoSaving(false);
  };

  // Manual save
  const handleManualSave = () => {
    saveToLocalStorage();
    toast.success("Notes saved to local storage!");
  };

  // Clear all content
  const handleClear = () => {
    if (content.trim() && !confirm("Are you sure you want to clear all notes? This action cannot be undone.")) {
      return;
    }
    
    setContent("");
    setLastSaved(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Notes cleared!");
  };

  // Export notes to markdown file
  const handleExport = () => {
    if (!content.trim()) {
      toast.error("No content to export!");
      return;
    }

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notes-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Notes exported successfully!");
  };

  // Import notes from markdown file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt') && file.type !== 'text/markdown' && file.type !== 'text/plain') {
      toast.error("Please select a markdown (.md) or text (.txt) file!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
      if (fileContent) {
        if (content.trim() && !confirm("Importing will replace your current notes. Continue?")) {
          return;
        }
        setContent(fileContent);
        toast.success("Notes imported successfully!");
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file!");
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Copy all content to clipboard
  const handleCopyAll = async () => {
    if (!content.trim()) {
      toast.error("No content to copy!");
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      toast.success("All content copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard!");
    }
  };

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return "Never";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Markdown Notepad</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isAutoSaving && <span>Saving...</span>}
          {!isAutoSaving && <span>Last saved: {formatLastSaved(lastSaved)}</span>}
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Markdown Notes
            </CardTitle>
            <CardDescription>
              Write your notes in Markdown format. Changes are automatically saved to your browser&apos;s local storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleManualSave} variant="default" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Now
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export .md
              </Button>
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline" 
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={handleCopyAll} variant="outline" size="sm">
                Copy All
              </Button>
              <Button onClick={handleClear} variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>

            {/* Hidden file input for import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              onChange={handleImport}
              className="hidden"
            />

            {/* Main textarea */}
            <div className="space-y-2">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your markdown notes here...

# Example Markdown

## Headers
Use # for headers (h1), ## for h2, etc.

## Text Formatting
- **Bold text**
- *Italic text*
- `Inline code`
- ~~Strikethrough~~

## Lists
1. Numbered list item
2. Another item

- Bullet point
- Another bullet

## Links and Images
[Link text](https://example.com)
![Alt text](image-url)

## Code Blocks
```javascript
function hello() {
  console.log('Hello, World!');
}
```

## Tables
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

## Quotes
> This is a blockquote
> - Author

---

Happy note-taking! 📝"
                className="min-h-[500px] font-mono text-sm resize-y"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
              <div className="flex gap-4">
                <span>Characters: {content.length.toLocaleString()}</span>
                <span>Words: {content.trim() ? content.trim().split(/\s+/).length.toLocaleString() : 0}</span>
                <span>Lines: {content.split('\n').length.toLocaleString()}</span>
              </div>
              <div>
                Auto-save enabled
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Markdown Cheat Sheet */}
        <Card>
          <CardHeader>
            <CardTitle>Markdown Quick Reference</CardTitle>
            <CardDescription>
              Common Markdown syntax for formatting your notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Headers</h4>
                <div className="space-y-1 font-mono text-xs">
                  <div># H1 Header</div>
                  <div>## H2 Header</div>
                  <div>### H3 Header</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Text Formatting</h4>
                <div className="space-y-1 font-mono text-xs">
                  <div>**Bold text**</div>
                  <div>*Italic text*</div>
                  <div>`Inline code`</div>
                  <div>~~Strikethrough~~</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Lists</h4>
                <div className="space-y-1 font-mono text-xs">
                  <div>1. Numbered list</div>
                  <div>- Bullet list</div>
                  <div>- [x] Task list</div>
                  <div>- [ ] Unchecked</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Links & Images</h4>
                <div className="space-y-1 font-mono text-xs">
                  <div>[Link](url)</div>
                  <div>![Image](url)</div>
                  <div>&lt;https://example.com&gt;</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Code</h4>
                <div className="space-y-1 font-mono text-xs">
                  <div>```language</div>
                  <div>code block</div>
                  <div>```</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Other</h4>
                <div className="space-y-1 font-mono text-xs">
                  <div>&gt; Blockquote</div>
                  <div>--- Horizontal rule</div>
                  <div>| Table | Cell |</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
