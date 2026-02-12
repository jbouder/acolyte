'use client';

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
import { allTools } from '@/lib/tools-data';

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
              {allTools.map((item) => (
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
