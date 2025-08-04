"use client";

import {
  Home,
  Settings,
  Cable,
  Zap,
  FileText,
  Key,
  Wifi,
  Code2,
  Braces,
  Palette,
  BarChart3,
  Database,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Basic APIs",
    url: "/basic-apis",
    icon: Code2,
  },
  {
    title: "SSE",
    url: "/sse",
    icon: Zap,
  },
  {
    title: "WebSockets",
    url: "/websockets",
    icon: Cable,
  },
  {
    title: "WebTransport",
    url: "/webtransport",
    icon: Wifi,
  },
  {
    title: "Web Stats",
    url: "/web-stats",
    icon: BarChart3,
  },
  {
    title: "Web Storage",
    url: "/web-storage",
    icon: Database,
  },
  {
    title: "Base64",
    url: "/base64",
    icon: FileText,
  },
  {
    title: "JSON Formatter",
    url: "/json-formatter",
    icon: Braces,
  },
  {
    title: "Color Picker",
    url: "/color-picker",
    icon: Palette,
  },
  {
    title: "JWT Decoder",
    url: "/jwt",
    icon: Key,
  },
  {
    title: "Notepad",
    url: "/notepad",
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
            <span className="text-sm font-semibold">Web Tools</span>
            <span className="text-xs text-muted-foreground">Dev Utilities</span>
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
