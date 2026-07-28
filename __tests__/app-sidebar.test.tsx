import { render, screen } from '@testing-library/react';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

jest.mock('next/navigation', () => ({
  usePathname: () => '/chat',
  // TransitionLink calls useRouter, which needs a mounted app router.
  useRouter: () => ({ push: jest.fn() }),
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
    // Base UI emits boolean state as a valueless data attribute.
    expect(chatLink).toHaveAttribute('data-active', '');

    const notepadLink = screen.getByRole('link', { name: /^Notepad$/i });
    expect(notepadLink).not.toHaveAttribute('data-active');
  });
});
