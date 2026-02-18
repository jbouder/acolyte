'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { searchableTools, type ToolCategory } from '@/lib/tools-data';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const groupedTools = searchableTools.reduce(
  (acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  },
  {} as Record<ToolCategory, typeof searchableTools>,
);

const categoryOrder: ToolCategory[] = [
  'API Testing',
  'Analysis',
  'Utilities',
  'Other',
];

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false);
      router.push(url);
    },
    [router],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Search className="h-4 w-4" />
        <span className="hidden xl:inline">Search tools...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Tools"
        description="Search for developer tools by name, description, or keyword"
        showCloseButton={false}
      >
        <CommandInput placeholder="Search tools..." />
        <CommandList>
          <CommandEmpty>No tools found.</CommandEmpty>
          {categoryOrder.map((category) => {
            const tools = groupedTools[category];
            if (!tools?.length) return null;
            return (
              <CommandGroup key={category} heading={category}>
                {tools.map((tool) => (
                  <CommandItem
                    key={tool.url}
                    value={`${tool.title} ${tool.description} ${tool.keywords.join(' ')}`}
                    onSelect={() => handleSelect(tool.url)}
                  >
                    <tool.icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{tool.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {tool.description}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
