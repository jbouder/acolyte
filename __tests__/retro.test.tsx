import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import RetroPage from '@/app/retro/page';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockFetch = jest.fn();

function mockSupabaseResponse(status: number, body?: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body ?? {})),
    json: () => Promise.resolve(body),
  });
}

describe('RetroPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    global.fetch = mockFetch;

    Object.defineProperty(window, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: (values: Uint8Array) => {
          values.fill(1);
          return values;
        },
      },
    });

    Object.defineProperty(window, 'confirm', {
      configurable: true,
      value: jest.fn(() => true),
    });
  });

  it('renders create and join controls with setup SQL', () => {
    render(<RetroPage />);

    expect(screen.getByRole('heading', { name: 'Retro Board' })).toBeInTheDocument();
    expect(screen.getByLabelText('Project URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Anon key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create retro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join retro' })).toBeInTheDocument();
    expect(screen.getByText(/create table retros/)).toBeInTheDocument();
  });

  it('creates a retro session and allows the owner to add and delete items', async () => {
    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/rest/v1/retros') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        return mockSupabaseResponse(201, [{ id: 'retro-1', ...body }]);
      }

      if (url.includes('/rest/v1/retro_items') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        return mockSupabaseResponse(201, [{ id: 'item-1', ...body, author: 'Ada' }]);
      }

      if (init?.method === 'DELETE') {
        return mockSupabaseResponse(204);
      }

      return mockSupabaseResponse(200, []);
    });

    render(<RetroPage />);

    fireEvent.change(screen.getByLabelText('Project URL'), {
      target: { value: 'https://example.supabase.co/' },
    });
    fireEvent.change(screen.getByLabelText('Anon key'), {
      target: { value: 'anon-key' },
    });
    fireEvent.change(screen.getByLabelText('Retro name'), {
      target: { value: 'Sprint retro' },
    });
    fireEvent.submit(screen.getByText('Create session').closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Session 1111111111')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Join retro' }));
    fireEvent.change(screen.getByLabelText('Your name'), {
      target: { value: 'Ada' },
    });

    const wentWellColumn = screen.getByText('Went well').closest('div')!.parentElement!;
    fireEvent.change(within(wentWellColumn).getByLabelText('New item for Went well'), {
      target: { value: 'Strong collaboration' },
    });
    fireEvent.click(within(wentWellColumn).getByRole('button', { name: 'Add item' }));

    await waitFor(() => {
      expect(screen.getByText('Strong collaboration')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete retro' }));

    await waitFor(() => {
      expect(screen.getByText('No retro loaded yet.')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.supabase.co/rest/v1/retros?select=*',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/retros?session_id=eq.1111111111&owner_token=eq.11111111111111111111111111111111'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('joins an existing retro session and loads board items', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/rest/v1/retros')) {
        return mockSupabaseResponse(200, [
          {
            id: 'retro-1',
            session_id: 'ABC123',
            owner_token: 'owner-token',
            name: 'Team retro',
            columns: ['Happy', 'Puzzled'],
          },
        ]);
      }

      return mockSupabaseResponse(200, [
        {
          id: 'item-1',
          session_id: 'ABC123',
          column_name: 'Happy',
          content: 'Shipped the release',
          author: 'Grace',
        },
      ]);
    });

    render(<RetroPage />);

    fireEvent.change(screen.getByLabelText('Project URL'), {
      target: { value: 'https://example.supabase.co' },
    });
    fireEvent.change(screen.getByLabelText('Anon key'), {
      target: { value: 'anon-key' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join retro' }));
    fireEvent.change(screen.getByLabelText('Session id'), {
      target: { value: 'abc123' },
    });
    fireEvent.submit(screen.getByText('Join session').closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Team retro')).toBeInTheDocument();
      expect(screen.getByText('Shipped the release')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Delete retro' })).not.toBeInTheDocument();
  });
});
