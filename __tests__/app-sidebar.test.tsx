import { render, screen } from '@testing-library/react';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

jest.mock('next/navigation', () => ({
  usePathname: () => '/chat',
}));

jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

describe('AppSidebar', () => {
  it('includes tool links in the sidebar and marks the active route', () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    const chatLink = screen.getByRole('link', { name: /^Chat$/i });

    expect(chatLink).toHaveAttribute('href', '/chat');
    expect(chatLink).toHaveAttribute('data-active', 'true');
  });
});
