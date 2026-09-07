import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import SSEPage from '../app/sse/page';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('SSE Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the SSE page with all form fields', () => {
    render(<SSEPage />);

    expect(screen.getByText('Server-Sent Events (SSE)')).toBeInTheDocument();
    expect(screen.getByText('SSE Connection')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('http://localhost:5000/llm/stream'),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('{"Content-Type": "application/json"}'),
    ).toBeInTheDocument();
    // Body field is not visible by default since GET is the default method
    expect(
      screen.queryByPlaceholderText('{"prompt": "Your prompt here"}'),
    ).not.toBeInTheDocument();
  });

  it('displays default values', () => {
    render(<SSEPage />);

    const endpointInput = screen.getByPlaceholderText(
      'http://localhost:5000/llm/stream',
    ) as HTMLInputElement;
    expect(endpointInput.value).toBe(
      'https://stream.wikimedia.org/v2/stream/recentchange',
    );

    const headersTextarea = screen.getByPlaceholderText(
      '{"Content-Type": "application/json"}',
    ) as HTMLTextAreaElement;
    expect(headersTextarea.value).toContain('Content-Type');
    expect(headersTextarea.value).toContain('application/json');
    expect(headersTextarea.value).toContain('Accept');
    expect(headersTextarea.value).toContain('text/event-stream');
  });

  it('shows error toast for invalid JSON in headers', async () => {
    render(<SSEPage />);

    // Enter invalid JSON in headers
    const headersTextarea = screen.getByPlaceholderText(
      '{"Content-Type": "application/json"}',
    );
    fireEvent.change(headersTextarea, { target: { value: '{invalid json}' } });

    // Try to connect
    const connectButton = screen.getByRole('button', { name: /^Connect$/i });
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid JSON in headers field');
    });
  });

  it('displays connection status', () => {
    render(<SSEPage />);

    expect(screen.getByText('Connection Status')).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText(/Messages received: 0/)).toBeInTheDocument();
    expect(screen.getByText(/Connection time: 0s/)).toBeInTheDocument();
    expect(screen.getByText(/Method: GET/)).toBeInTheDocument();
  });

  it('displays request details', () => {
    render(<SSEPage />);

    expect(screen.getByText('Request Details')).toBeInTheDocument();
    expect(screen.getByText('Headers:')).toBeInTheDocument();
    // Body should not be visible since GET is default and no body is set
    expect(screen.queryByText('Body:')).not.toBeInTheDocument();
  });

  it('allows updating endpoint URL', () => {
    render(<SSEPage />);

    const endpointInput = screen.getByPlaceholderText(
      'http://localhost:5000/llm/stream',
    ) as HTMLInputElement;
    const newUrl = 'http://example.com/events';

    fireEvent.change(endpointInput, { target: { value: newUrl } });

    expect(endpointInput.value).toBe(newUrl);
  });

  it('allows updating custom headers', () => {
    render(<SSEPage />);

    const headersTextarea = screen.getByPlaceholderText(
      '{"Content-Type": "application/json"}',
    ) as HTMLTextAreaElement;
    const newHeaders = '{"Authorization": "Bearer token123"}';

    fireEvent.change(headersTextarea, { target: { value: newHeaders } });

    expect(headersTextarea.value).toBe(newHeaders);
  });

  it('has clear and export buttons', () => {
    render(<SSEPage />);

    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
  });

  it('displays event stream section', () => {
    render(<SSEPage />);

    expect(screen.getByText('Event Stream')).toBeInTheDocument();
    expect(
      screen.getByText('Real-time display of incoming SSE messages'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Filter messages...'),
    ).toBeInTheDocument();
  });
});
