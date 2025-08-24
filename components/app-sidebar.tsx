'use client';

import {
  BarChart3,
  Braces,
  Cable,
  Code2,
  FileText,
  GitBranch,
  Home,
  Key,
  Palette,
  SearchCode,
  Settings,
  StickyNote,
  Wifi,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// Menu items.
const items = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Basic APIs',
    url: '/basic-apis',
    icon: Code2,
  },
  {
    title: 'SSE',
    url: '/sse',
    icon: Zap,
  },
  {
    title: 'WebSockets',
    url: '/websockets',
    icon: Cable,
  },
  {
    title: 'WebTransport',
    url: '/webtransport',
    icon: Wifi,
  },
  {
    title: 'Website Analysis',
    url: '/website-analysis',
    icon: BarChart3,
  },
  {
    title: 'Dependency Analysis',
    url: '/dependency-analysis',
    icon: GitBranch,
  },
  {
    title: 'Base64 Encoding',
    url: '/base64',
    icon: FileText,
  },
  {
    title: 'JSON Formatter',
    url: '/json-formatter',
    icon: Braces,
  },
  {
    title: 'Regex Tester',
    url: '/regex',
    icon: SearchCode,
  },
  {
    title: 'Color Picker',
    url: '/color-picker',
    icon: Palette,
  },
  {
    title: 'JWT Decoder',
    url: '/jwt',
    icon: Key,
  },
  {
    title: 'Cheat Codes',
    url: '/cheat-codes',
    icon: StickyNote,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border h-17">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 hover:bg-sidebar-accent rounded-md transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Settings className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Project Acolyte</span>
            <span className="text-xs text-muted-foreground">Assistant</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
