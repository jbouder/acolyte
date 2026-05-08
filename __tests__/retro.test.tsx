import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import RetroSessionPage from '@/app/retro/[retroId]/page';
import RetroPage, { getOwnerTokenKey } from '@/app/retro/page';

const mockUseParams = jest.fn();

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
}));

const mockFetch = jest.fn();

function createMockResponse(status: number, body?: unknown) {
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
    mockUseParams.mockReturnValue({});
    localStorage.clear();
    global.fetch = mockFetch;

    Object.defineProperty(window, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: (values: Uint8Array) => {
          values.fill(1);
          return values;
        },
        subtle: {
          digest: jest.fn(() =>
            Promise.resolve(new Uint8Array(32).fill(2).buffer),
          ),
        },
      },
    });

    Object.defineProperty(window, 'confirm', {
      configurable: true,
      value: jest.fn(() => true),
    });
  });

  it('renders join and create controls before setup sections', () => {
    render(<RetroPage />);

    expect(
      screen.getByRole('heading', { name: 'Retro Board' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Join retro' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create retro' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Project URL')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Anon key')).not.toBeInTheDocument();
    expect(screen.queryByText(/create table retros/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Create retro' }));

    expect(screen.getByLabelText('Project URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Anon key')).toBeInTheDocument();
    expect(screen.getByText(/create table retros/)).toBeInTheDocument();
  });

  it('creates a retro session and allows the owner to add and delete items', async () => {
    mockFetch.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/rest/v1/retros') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        return createMockResponse(201, [{ id: 'retro-1', ...body }]);
      }

      if (url.includes('/rest/v1/rpc/verify_retro_owner')) {
        return createMockResponse(200, true);
      }

      if (url.includes('/rest/v1/retro_items') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        return createMockResponse(201, [
          { id: 'item-1', ...body, author: 'Ada' },
        ]);
      }

      if (init?.method === 'DELETE') {
        return createMockResponse(204);
      }

      return createMockResponse(200, []);
    });

    render(<RetroPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Create retro' }));
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
      expect(screen.getByText('Session 1111111111111111')).toBeInTheDocument();
    });

    const wentWellColumn = screen
      .getByText('Went well')
      .closest('div')!.parentElement!;
    fireEvent.change(
      within(wentWellColumn).getByLabelText('New item for Went well'),
      {
        target: { value: 'Strong collaboration' },
      },
    );
    fireEvent.click(
      within(wentWellColumn).getByRole('button', { name: 'Add item' }),
    );

    await waitFor(() => {
      expect(screen.getByText('Strong collaboration')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Delete retro' }),
      ).toBeEnabled();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete retro' }));

    await waitFor(() => {
      expect(screen.getByText('No retro loaded yet.')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.supabase.co/rest/v1/retros?select=id,session_id,name,columns,created_at',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/retros?session_id=eq.1111111111111111'),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'x-owner-token-hash': '02'.repeat(32),
        }),
      }),
    );
  });

  it('joins an existing retro session and loads board items', async () => {
    localStorage.setItem(
      'acolyte-retro-supabase-config',
      JSON.stringify({
        url: 'https://example.supabase.co',
        anonKey: 'anon-key',
      }),
    );

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/rest/v1/retros')) {
        return createMockResponse(200, [
          {
            id: 'retro-1',
            session_id: 'ABC123',
            name: 'Team retro',
            columns: ['Happy', 'Puzzled'],
          },
        ]);
      }

      return createMockResponse(200, [
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

    fireEvent.change(screen.getByLabelText('Session id'), {
      target: { value: 'abc123' },
    });
    fireEvent.submit(screen.getByText('Join session').closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Team retro')).toBeInTheDocument();
      expect(screen.getByText('Shipped the release')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: 'Delete retro' }),
    ).not.toBeInTheDocument();
  });

  it('does not allow delete when the local creator token cannot be verified', async () => {
    localStorage.setItem(
      'acolyte-retro-supabase-config',
      JSON.stringify({
        url: 'https://example.supabase.co',
        anonKey: 'anon-key',
      }),
    );
    localStorage.setItem(getOwnerTokenKey('ABC123'), 'stale-token');

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/rest/v1/rpc/verify_retro_owner')) {
        return createMockResponse(200, false);
      }

      if (url.includes('/rest/v1/retros')) {
        return createMockResponse(200, [
          {
            id: 'retro-1',
            session_id: 'ABC123',
            name: 'Team retro',
            columns: ['Happy'],
          },
        ]);
      }

      return createMockResponse(200, []);
    });

    render(<RetroPage />);

    fireEvent.change(screen.getByLabelText('Session id'), {
      target: { value: 'abc123' },
    });
    fireEvent.submit(screen.getByText('Join session').closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Team retro')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Delete retro' }),
      ).not.toBeInTheDocument();
    });

    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('loads a retro session from the dynamic route id', async () => {
    mockUseParams.mockReturnValue({ retroId: 'abc123' });
    localStorage.setItem(
      'acolyte-retro-supabase-config',
      JSON.stringify({
        url: 'https://example.supabase.co',
        anonKey: 'anon-key',
      }),
    );

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/rest/v1/retros')) {
        return createMockResponse(200, [
          {
            id: 'retro-1',
            session_id: 'ABC123',
            name: 'Route retro',
            columns: ['Wins'],
          },
        ]);
      }

      return createMockResponse(200, []);
    });

    render(<RetroSessionPage />);

    expect(screen.getByLabelText('Session id')).toHaveValue('ABC123');

    await waitFor(() => {
      expect(screen.getByText('Route retro')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        '/rest/v1/retros?session_id=eq.ABC123&select=id,session_id,name,columns,created_at',
      ),
      expect.any(Object),
    );
  });
});
