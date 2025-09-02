'use client';

import { Github } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function GitHubLink() {
  return (
    <Button variant="ghost" size="icon" asChild>
      <a
        href="https://github.com/jbouder/acolyte"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View source code on GitHub"
      >
        <Github className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">View source on GitHub</span>
      </a>
    </Button>
  );
}
