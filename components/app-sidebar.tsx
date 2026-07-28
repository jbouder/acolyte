'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { TransitionLink } from '@/components/transition-link';

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
import { allTools, categoryTones } from '@/lib/tools-data';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      {/* No bottom rule: the sidebar reads as one uninterrupted column, and the
          main header's border already carries that line across the content. */}
      <SidebarHeader className="h-17">
        <TransitionLink
          href="/"
          className="flex items-center gap-2 px-4 py-2 hover:bg-sidebar-accent rounded-md transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md">
            <Image
              src="/logo_sm.png"
              alt="Acolyte Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain dark:invert"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Project Acolyte</span>
            <span className="text-xs text-muted-foreground">Web Tools</span>
          </div>
        </TransitionLink>
      </SidebarHeader>
      <SidebarContent>
        {/* pt-0 drops the group's 8px top padding so the first row's highlight
            starts flush with the main header's bottom border. */}
        <SidebarGroup className="pt-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {allTools.map((item) => {
                const tone = categoryTones[item.category];
                const isActive = pathname === item.url;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<TransitionLink href={item.url} />}
                      isActive={isActive}
                      // The active row gets a 2px rule in its own category
                      // colour, so the sidebar reads as colour-coded groups
                      // without needing separate group headings.
                      className={`border-l-2 ${
                        isActive ? tone.edge : 'border-l-transparent'
                      }`}
                    >
                      <item.icon />
                      <span className="text-sidebar-foreground">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
