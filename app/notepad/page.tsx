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
import { notepadStorage } from '@/lib/notepad-storage';
import { Download, FileText, Save, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function NotepadPage() {
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load content from IndexedDB on component mount
  useEffect(() => {
    const loadContent = async () => {
      try {
        // First try to migrate from localStorage if needed
        await notepadStorage.migrateFromLocalStorage();

        // Load from IndexedDB
        const savedData = await notepadStorage.load();
        if (savedData) {
          setContent(savedData.content || '');
          setLastSaved(
            savedData.lastSaved ? new Date(savedData.lastSaved) : null,
          );
        }
      } catch (error) {
        console.warn('Failed to load notepad content:', error);
        toast.error('Failed to load saved notes');
      }
    };

    loadContent();
  }, []);

  // Auto-save to IndexedDB with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!content.trim()) return;

      setIsAutoSaving(true);
      try {
        const saveData = {
          content,
          lastSaved: new Date().toISOString(),
        };

        await notepadStorage.save(saveData);
        setLastSaved(new Date());
      } catch (error) {
        console.warn('Auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [content]);

  // Save content to IndexedDB
  const saveToIndexedDB = async () => {
    if (!content.trim()) return;

    setIsAutoSaving(true);
    try {
      const saveData = {
        content,
        lastSaved: new Date().toISOString(),
      };

      await notepadStorage.save(saveData);
      setLastSaved(new Date());
    } catch (error) {
      console.warn('Save failed:', error);
      toast.error('Failed to save notes');
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Manual save
  const handleManualSave = async () => {
    await saveToIndexedDB();
    toast.success('Notes saved successfully!');
  };

  // Clear all content
  const handleClear = async () => {
    if (
      content.trim() &&
      !confirm(
        'Are you sure you want to clear all notes? This action cannot be undone.',
      )
    ) {
      return;
    }

    setContent('');
    setLastSaved(null);
    try {
      await notepadStorage.clear();
      toast.success('Notes cleared!');
    } catch (error) {
      console.warn('Failed to clear notes:', error);
      toast.error('Failed to clear notes');
    }
  };

  // Export notes to markdown file
  const handleExport = () => {
    if (!content.trim()) {
      toast.error('No content to export!');
      return;
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Notes exported successfully!');
  };

  // Import notes from markdown file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (
      !file.name.endsWith('.md') &&
      !file.name.endsWith('.txt') &&
      file.type !== 'text/markdown' &&
      file.type !== 'text/plain'
    ) {
      toast.error('Please select a markdown (.md) or text (.txt) file!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
      if (fileContent) {
        if (
          content.trim() &&
          !confirm('Importing will replace your current notes. Continue?')
        ) {
          return;
        }
        setContent(fileContent);
        toast.success('Notes imported successfully!');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file!');
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Copy all content to clipboard
  const handleCopyAll = async () => {
    if (!content.trim()) {
      toast.error('No content to copy!');
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      toast.success('All content copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard!');
    }
  };

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60)
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notepad</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isAutoSaving && <span>Saving...</span>}
          {!isAutoSaving && (
            <span>Last saved: {formatLastSaved(lastSaved)}</span>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Developer Notepad
            </CardTitle>
            <CardDescription>
              Store your coding snippets, commands, and quick references in
              Markdown format. Perfect for keeping your development notes
              organized and accessible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Disclaimer */}
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="text-yellow-600">⚠️</div>
                <div className="text-yellow-800">
                  <strong>Important:</strong> Your notes are stored in your
                  browser&apos;s IndexedDB and may be lost when clearing browser
                  data. Use the export button regularly to backup your important
                  notes.
                </div>
              </div>
            </div>

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
                placeholder="Add your notes and code snippets here..."
                className="min-h-[500px] font-mono text-sm resize-y"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
              <div className="flex gap-4">
                <span>Characters: {content.length.toLocaleString()}</span>
                <span>
                  Words:{' '}
                  {content.trim()
                    ? content.trim().split(/\s+/).length.toLocaleString()
                    : 0}
                </span>
                <span>
                  Lines: {content.split('\n').length.toLocaleString()}
                </span>
              </div>
              <div>Auto-save enabled</div>
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
