'use client';

import {
  BarChart3,
  BookOpen,
  Braces,
  Cable,
  Code2,
  Eye,
  FileText,
  Gamepad2,
  GitBranch,
  GitGraph,
  Home,
  Key,
  PackageSearch,
  Palette,
  ScanEye,
  SearchCode,
  Settings,
  StickyNote,
  Wifi,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
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
    title: 'APIs',
    url: '/apis',
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
    title: 'Web Stats',
    url: '/web-stats',
    icon: Settings,
  },
  {
    title: 'Website Analysis',
    url: '/website-analysis',
    icon: BarChart3,
  },
  {
    title: 'Accessibility Checker',
    url: '/accessibility-checker',
    icon: ScanEye,
  },
  {
    title: 'Dependency Analysis',
    url: '/dependency-analysis',
    icon: GitBranch,
  },
  {
    title: 'SBOM Report',
    url: '/sbom-report',
    icon: PackageSearch,
  },
  {
    title: 'Markdown Preview',
    url: '/markdown-preview',
    icon: Eye,
  },
  {
    title: 'Mermaid Preview',
    url: '/mermaid-preview',
    icon: GitGraph,
  },
  {
    title: 'Swagger Viewer',
    url: '/swagger-viewer',
    icon: BookOpen,
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
    title: 'Notepad',
    url: '/notepad',
    icon: StickyNote,
  },
  {
    title: 'Games',
    url: '/games',
    icon: Gamepad2,
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
          <div className="flex h-8 w-8 items-center justify-center rounded-md">
            <Image
              src="/logo_sm.png"
              alt="Acolyte Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Project Acolyte</span>
            <span className="text-xs text-muted-foreground">Web Tools</span>
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
