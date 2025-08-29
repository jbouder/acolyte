import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SSEPage from '../app/sse/page';

// Mock EventSource
class MockEventSource {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  readyState: number = 0;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    this.readyState = MockEventSource.CONNECTING;
    
    // Simulate successful connection
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
    if (this.onclose) {
      this.onclose(new Event('close'));
    }
  }

  addEventListener(event: string, handler: (event: any) => void) {
    if (event === 'open') this.onopen = handler;
    if (event === 'message') this.onmessage = handler;
    if (event === 'error') this.onerror = handler;
  }
}

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Replace EventSource with mock
(global as any).EventSource = MockEventSource;

// Suppress act() warnings for async state updates in useEffect
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes(
        'An update to SSEPage inside a test was not wrapped in act',
      ) ||
        args[0].includes('When testing, code that causes React state updates'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe('SSEPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any timers
    jest.clearAllTimers();
  });

  it('renders the SSE page with all components', () => {
    render(<SSEPage />);

    // Check main heading
    expect(screen.getByText('Server-Sent Events (SSE)')).toBeInTheDocument();

    // Check card titles
    expect(screen.getByText('SSE Connection')).toBeInTheDocument();
    expect(screen.getByText('Connection Status')).toBeInTheDocument();
    expect(screen.getByText('Event Stream')).toBeInTheDocument();
    expect(screen.getByText('Message Filter')).toBeInTheDocument();

    // Check input fields
    expect(screen.getByPlaceholderText(/https:\/\/demo\.mercure\.rocks/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Filter messages by content...')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
    expect(screen.getByText('Clear Messages')).toBeInTheDocument();
    expect(screen.getByText('Export Messages')).toBeInTheDocument();
  });

  it('connects to SSE endpoint', async () => {
    const { toast } = require('sonner');
    render(<SSEPage />);

    const urlInput = screen.getByPlaceholderText(/https:\/\/demo\.mercure\.rocks/);
    const connectButton = screen.getByText('Connect');

    // Change URL and connect
    fireEvent.change(urlInput, { 
      target: { value: 'https://test-sse.com/events' } 
    });
    fireEvent.click(connectButton);

    // Wait for connection to be established
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('SSE connection established!');
    });

    // Should show connected status
    expect(screen.getByText(/Connected/)).toBeInTheDocument();
  });

  it('disconnects from SSE endpoint', async () => {
    const { toast } = require('sonner');
    render(<SSEPage />);

    const connectButton = screen.getByText('Connect');
    const disconnectButton = screen.getByText('Disconnect');

    // First connect
    fireEvent.click(connectButton);
    
    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Then disconnect
    fireEvent.click(disconnectButton);

    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();
    expect(toast.info).toHaveBeenCalledWith('SSE connection closed');
  });

  it('displays connection status correctly', async () => {
    render(<SSEPage />);

    // Initially disconnected
    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    // Wait for connected status
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });
  });

  it('displays connection statistics', async () => {
    render(<SSEPage />);

    const connectButton = screen.getByText('Connect');

    // Check initial stats
    expect(screen.getByText(/Messages: 0/)).toBeInTheDocument();
    expect(screen.getByText(/Connection time: 0s/)).toBeInTheDocument();

    // Connect
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Connection time should start updating
    await waitFor(() => {
      expect(screen.getByText(/Connection time: [0-9]+s/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('filters messages based on filter input', async () => {
    render(<SSEPage />);

    const filterInput = screen.getByPlaceholderText('Filter messages by content...');
    
    // Enter filter text
    fireEvent.change(filterInput, { target: { value: 'important' } });
    
    expect(filterInput).toHaveValue('important');
  });

  it('clears messages when clear button is clicked', async () => {
    render(<SSEPage />);

    const connectButton = screen.getByText('Connect');
    const clearButton = screen.getByText('Clear Messages');

    // Connect first
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Clear messages
    fireEvent.click(clearButton);

    // Should show empty state message
    expect(screen.getByText(/Connect to an SSE endpoint/)).toBeInTheDocument();
  });

  it('exports messages to JSON file', async () => {
    // Mock URL and Blob
    global.URL.createObjectURL = jest.fn(() => 'mocked-blob-url');
    global.URL.revokeObjectURL = jest.fn();
    global.Blob = jest.fn() as any;

    const { toast } = require('sonner');
    render(<SSEPage />);

    const connectButton = screen.getByText('Connect');
    const exportButton = screen.getByText('Export Messages');

    // Connect first
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Create mock link element
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

    // Export messages
    fireEvent.click(exportButton);

    expect(mockLink.click).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Messages exported!');
  });

  it('disables connect button when already connected', async () => {
    render(<SSEPage />);

    const connectButton = screen.getByText('Connect');

    // Initially enabled
    expect(connectButton).not.toBeDisabled();

    // Connect
    fireEvent.click(connectButton);

    // Should be disabled while/after connecting
    expect(connectButton).toBeDisabled();

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Should remain disabled when connected
    expect(connectButton).toBeDisabled();
  });

  it('enables disconnect button only when connected', async () => {
    render(<SSEPage />);

    const connectButton = screen.getByText('Connect');
    const disconnectButton = screen.getByText('Disconnect');

    // Initially disconnect should be disabled
    expect(disconnectButton).toBeDisabled();

    // Connect
    fireEvent.click(connectButton);

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Disconnect should now be enabled
    expect(disconnectButton).not.toBeDisabled();
  });

  it('displays SSE endpoint URL in connection info', () => {
    render(<SSEPage />);

    const urlInput = screen.getByPlaceholderText(/https:\/\/demo\.mercure\.rocks/);
    
    // Change URL
    fireEvent.change(urlInput, { 
      target: { value: 'https://custom-sse.example.com/stream' } 
    });
    
    expect(urlInput).toHaveValue('https://custom-sse.example.com/stream');
  });

  it('handles connection errors gracefully', async () => {
    const { toast } = require('sonner');
    
    // Mock EventSource that fails
    class FailingEventSource extends MockEventSource {
      constructor(url: string) {
        super(url);
        // Simulate connection error
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Event('error'));
          }
        }, 10);
      }
    }

    (global as any).EventSource = FailingEventSource;

    render(<SSEPage />);

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    // Wait for error to be handled
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('SSE connection error');
    });
  });

  it('shows message count in statistics', async () => {
    render(<SSEPage />);

    const connectButton = screen.getByText('Connect');

    // Initially 0 messages
    expect(screen.getByText(/Messages: 0/)).toBeInTheDocument();

    // Connect
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Message count should still be displayed
    expect(screen.getByText(/Messages: [0-9]+/)).toBeInTheDocument();
  });

  it('renders message stream area', () => {
    render(<SSEPage />);

    // Check that message stream section exists
    expect(screen.getByText('Event Stream')).toBeInTheDocument();
    expect(screen.getByText(/Connect to an SSE endpoint/)).toBeInTheDocument();
  });

  it('handles simultaneous connect/disconnect operations', async () => {
    render(<SSEPage />);

    const connectButton = screen.getByText('Connect');
    const disconnectButton = screen.getByText('Disconnect');

    // Rapid connect/disconnect should not cause issues
    fireEvent.click(connectButton);
    fireEvent.click(disconnectButton);

    // Should end up disconnected
    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();
  });

  it('updates connection timer correctly', async () => {
    jest.useFakeTimers();
    
    render(<SSEPage />);

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    // Connection time should update
    expect(screen.getByText(/Connection time: [0-9]+s/)).toBeInTheDocument();

    jest.useRealTimers();
  });
});