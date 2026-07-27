import type { Metadata } from 'next';
import { JetBrains_Mono, Oxanium } from 'next/font/google';
import { AppSidebar } from '@/components/app-sidebar';
import { FloatingAssistant } from '@/components/floating-assistant';
import { GitHubLink } from '@/components/github-link';
import { SiteSearch } from '@/components/site-search';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const oxanium = Oxanium({
  variable: '--font-oxanium',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Project Acolyte',
  description:
    'A tool designed to assist web developers in their day-to-day duties.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variables live on <html> because `font-family` is applied
    // there; an undefined var() would invalidate the whole declaration.
    <html
      lang="en"
      className={`${oxanium.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('acolyte-theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else if (theme === 'light') {
                  document.documentElement.classList.add('light');
                } else {
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.classList.add(systemTheme);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider defaultTheme="system" storageKey="acolyte-theme">
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="sticky top-0 flex h-17 shrink-0 items-center gap-2 border-b bg-background px-4">
                  <SidebarTrigger className="-ml-1" />
                  <div className="ml-auto flex items-center gap-2">
                    <SiteSearch />
                    <GitHubLink />
                    <ThemeToggle />
                  </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
              </SidebarInset>
            </SidebarProvider>
            <Toaster />
            <FloatingAssistant />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
