import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SiteSearch } from '@/components/site-search';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('SiteSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the command palette, filters tools, and navigates on select', async () => {
    const user = userEvent.setup();
    render(<SiteSearch />);

    await user.click(screen.getByRole('button', { name: /search tools/i }));

    // The palette only renders results when cmdk's Command context is present,
    // so an empty list here means the dialog lost its <Command> wrapper.
    const input = await screen.findByPlaceholderText('Search tools...');
    await user.type(input, 'json formatter');

    const option = await screen.findByRole('option', {
      name: /JSON Formatter/,
    });
    await user.click(option);

    expect(mockPush).toHaveBeenCalledWith('/json-formatter');
  });

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<SiteSearch />);

    await user.click(screen.getByRole('button', { name: /search tools/i }));
    await user.type(
      await screen.findByPlaceholderText('Search tools...'),
      'zzzzzzz',
    );

    expect(await screen.findByText('No tools found.')).toBeInTheDocument();
  });
});
