import { render, screen } from '@testing-library/react';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

jest.mock('next/navigation', () => ({
  usePathname: () => '/retro',
}));

jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

describe('AppSidebar', () => {
  it('includes the Retro Board tool link in the sidebar', () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    const retroLink = screen.getByRole('link', { name: /Retro Board/i });

    expect(retroLink).toHaveAttribute('href', '/retro');
    expect(retroLink).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('link', { name: /^Chat$/i })).toHaveAttribute(
      'href',
      '/chat',
    );
  });
});
