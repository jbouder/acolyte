"use client";

import {
  Home,
  Settings,
  Cable,
  Zap,
  FileText,
  Key,
  Globe,
  Eye,
  MessageCircle,
  Wifi,
  Code2,
  User,
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
  SidebarFooter,
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
    title: "WebSockets",
    url: "/websockets",
    icon: Cable,
  },
  {
    title: "SSE",
    url: "/sse",
    icon: Zap,
  },
  {
    title: "WebTransport",
    url: "/webtransport",
    icon: Wifi,
  },
  {
    title: "Base64",
    url: "/base64",
    icon: FileText,
  },
  {
    title: "JWT Decoder",
    url: "/jwt",
    icon: Key,
  },
  {
    title: "Web Scraper",
    url: "/web-scraper",
    icon: Globe,
  },
  {
    title: "Accessibility",
    url: "/accessibility",
    icon: Eye,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageCircle,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
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
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
            U
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">User</span>
            <span className="text-xs text-muted-foreground">Developer</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
