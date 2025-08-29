import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WebSocketsPage from '../app/websockets/page';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    
    // Simulate successful connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Simulate sending message
    console.log('Sending:', data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Mock URL and Blob
global.URL.createObjectURL = jest.fn(() => 'mocked-blob-url');
global.URL.revokeObjectURL = jest.fn();
global.Blob = jest.fn() as any;

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Replace WebSocket with mock
(global as any).WebSocket = MockWebSocket;

describe('WebSocketsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the WebSocket page with all components', () => {
    render(<WebSocketsPage />);

    // Check main heading
    expect(screen.getByText('WebSockets')).toBeInTheDocument();

    // Check card titles
    expect(screen.getByText('WebSocket Connection')).toBeInTheDocument();
    expect(screen.getByText('Connection Status')).toBeInTheDocument();
    expect(screen.getByText('Send Message')).toBeInTheDocument();
    expect(screen.getByText('Message History')).toBeInTheDocument();

    // Check input fields
    expect(screen.getByPlaceholderText('wss://echo.websocket.org')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your message here...')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
    expect(screen.getByText('Send Message')).toBeInTheDocument();
    expect(screen.getByText('Clear History')).toBeInTheDocument();
    expect(screen.getByText('Export Messages')).toBeInTheDocument();
  });

  it('connects to WebSocket server', async () => {
    const { toast } = require('sonner');
    render(<WebSocketsPage />);

    const urlInput = screen.getByPlaceholderText('wss://echo.websocket.org');
    const connectButton = screen.getByText('Connect');

    // Change URL and connect
    fireEvent.change(urlInput, { target: { value: 'wss://test.com' } });
    fireEvent.click(connectButton);

    // Should show connecting status
    expect(screen.getByText(/Connecting/)).toBeInTheDocument();

    // Wait for connection to be established
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    expect(toast.success).toHaveBeenCalledWith('WebSocket connected!');
  });

  it('disconnects from WebSocket server', async () => {
    const { toast } = require('sonner');
    render(<WebSocketsPage />);

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
    expect(toast.info).toHaveBeenCalledWith('WebSocket disconnected');
  });

  it('sends messages when connected', async () => {
    render(<WebSocketsPage />);

    const connectButton = screen.getByText('Connect');
    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    const sendButton = screen.getByText('Send Message');

    // Connect first
    fireEvent.click(connectButton);
    
    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Enter message and send
    fireEvent.change(messageInput, { target: { value: 'Hello WebSocket!' } });
    fireEvent.click(sendButton);

    // Should clear the input after sending
    expect(messageInput).toHaveValue('');
  });

  it('prevents sending when not connected', () => {
    const { toast } = require('sonner');
    render(<WebSocketsPage />);

    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    const sendButton = screen.getByRole('button', { name: /send message/i });

    // Try to send without connecting
    fireEvent.change(messageInput, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    expect(toast.error).toHaveBeenCalledWith('Not connected to WebSocket');
  });

  it('clears message history', async () => {
    render(<WebSocketsPage />);

    const connectButton = screen.getByText('Connect');
    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    const sendButton = screen.getByText('Send Message');
    const clearButton = screen.getByText('Clear History');

    // Connect and send a message
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    // Clear history
    fireEvent.click(clearButton);

    // Check that "No messages" text appears
    expect(screen.getByText(/Connect to a WebSocket server/)).toBeInTheDocument();
  });

  it('exports messages', async () => {
    render(<WebSocketsPage />);

    const connectButton = screen.getByText('Connect');
    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    const sendButton = screen.getByText('Send Message');
    const exportButton = screen.getByText('Export Messages');

    // Connect and send a message
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    fireEvent.change(messageInput, { target: { value: 'Export test' } });
    fireEvent.click(sendButton);

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
  });

  it('displays connection status correctly', async () => {
    render(<WebSocketsPage />);

    // Initially disconnected
    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    // Should show connecting
    expect(screen.getByText(/Connecting/)).toBeInTheDocument();

    // Wait for connected
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });
  });

  it('displays message statistics', async () => {
    render(<WebSocketsPage />);

    const connectButton = screen.getByText('Connect');
    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    const sendButton = screen.getByText('Send Message');

    // Connect
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Check initial stats
    expect(screen.getByText(/Messages sent: 0/)).toBeInTheDocument();
    expect(screen.getByText(/Messages received: 0/)).toBeInTheDocument();

    // Send a message
    fireEvent.change(messageInput, { target: { value: 'Test' } });
    fireEvent.click(sendButton);

    // Stats should update
    await waitFor(() => {
      expect(screen.getByText(/Messages sent: 1/)).toBeInTheDocument();
    });
  });

  it('handles send on Enter key press', async () => {
    render(<WebSocketsPage />);

    const connectButton = screen.getByText('Connect');
    const messageInput = screen.getByPlaceholderText('Enter your message here...');

    // Connect first
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Enter message and press Enter
    fireEvent.change(messageInput, { target: { value: 'Hello via Enter!' } });
    fireEvent.keyDown(messageInput, { key: 'Enter', code: 'Enter' });

    // Message should be sent (input cleared)
    expect(messageInput).toHaveValue('');
  });

  it('disables connect button when already connected', async () => {
    render(<WebSocketsPage />);

    const connectButton = screen.getByText('Connect');

    // Initially enabled
    expect(connectButton).not.toBeDisabled();

    // Connect
    fireEvent.click(connectButton);

    // Should be disabled while connecting
    expect(connectButton).toBeDisabled();

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Should remain disabled when connected
    expect(connectButton).toBeDisabled();
  });

  it('enables disconnect button only when connected', async () => {
    render(<WebSocketsPage />);

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

  it('handles empty message input gracefully', async () => {
    render(<WebSocketsPage />);

    const connectButton = screen.getByText('Connect');
    const sendButton = screen.getByText('Send Message');

    // Connect first
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Try to send empty message
    fireEvent.click(sendButton);

    // Should not cause errors (component should handle gracefully)
    expect(screen.getByText(/Connected/)).toBeInTheDocument();
  });

  it('displays WebSocket URL in connection info', () => {
    render(<WebSocketsPage />);

    const urlInput = screen.getByPlaceholderText('wss://echo.websocket.org');
    
    // Change URL
    fireEvent.change(urlInput, { target: { value: 'wss://custom.websocket.com' } });
    
    expect(urlInput).toHaveValue('wss://custom.websocket.com');
  });
});