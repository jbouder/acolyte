'use client';

import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DocsLink() {
  return (
    <Button variant="ghost" size="icon" asChild>
      <a
        href="https://jbouder.github.io/acolyte/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View documentation"
      >
        <BookOpen className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">View documentation</span>
      </a>
    </Button>
  );
}
