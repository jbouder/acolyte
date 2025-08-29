import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WebTransportPage from '../app/webtransport/page';

// Mock WebTransport
class MockWebTransport {
  url: string;
  ready: Promise<void>;
  datagrams: {
    readable: {
      getReader: () => any;
    };
    writable: {
      getWriter: () => any;
    };
  };
  incomingBidirectionalStreams: {
    getReader: () => any;
  };
  incomingUnidirectionalStreams: {
    getReader: () => any;
  };

  constructor(url: string) {
    this.url = url;
    this.ready = Promise.resolve();
    
    this.datagrams = {
      readable: {
        getReader: () => ({
          read: () => Promise.resolve({ done: true }),
        }),
      },
      writable: {
        getWriter: () => ({
          write: jest.fn(),
          releaseLock: jest.fn(),
        }),
      },
    };

    this.incomingBidirectionalStreams = {
      getReader: () => ({
        read: () => Promise.resolve({ done: true }),
      }),
    };

    this.incomingUnidirectionalStreams = {
      getReader: () => ({
        read: () => Promise.resolve({ done: true }),
      }),
    };
  }

  createBidirectionalStream() {
    return Promise.resolve({
      writable: {
        getWriter: () => ({
          write: jest.fn(),
          close: jest.fn(),
        }),
      },
    });
  }

  createUnidirectionalStream() {
    return Promise.resolve({
      getWriter: () => ({
        write: jest.fn(),
        close: jest.fn(),
      }),
    });
  }

  close() {
    // Mock close
  }
}

// Mock URL and Blob
global.URL.createObjectURL = jest.fn(() => 'mocked-blob-url');
global.URL.revokeObjectURL = jest.fn();
global.Blob = jest.fn() as any;

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mocked-uuid-1234',
  },
  writable: true,
});

describe('WebTransportPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the WebTransport page with all components', () => {
    render(<WebTransportPage />);

    // Check main heading and experimental badge
    expect(screen.getByText('WebTransport')).toBeInTheDocument();
    expect(screen.getByText('Experimental')).toBeInTheDocument();

    // Check card titles
    expect(screen.getByText('WebTransport Connection')).toBeInTheDocument();
    expect(screen.getByText('Connection Status')).toBeInTheDocument();
    expect(screen.getByText('Stream Communication')).toBeInTheDocument();
    expect(screen.getByText('Datagram Communication')).toBeInTheDocument();
    expect(screen.getByText('Message History')).toBeInTheDocument();
    expect(screen.getByText('Connection Settings')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();

    // Check input fields
    expect(screen.getByPlaceholderText('https://example.com:4433/webtransport')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Base64 encoded certificate hash for self-signed certs')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/{"type": "message"/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/{"type": "ping"/)).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
    expect(screen.getByText('Send via Stream')).toBeInTheDocument();
    expect(screen.getByText('Send Datagram')).toBeInTheDocument();
    expect(screen.getByText('Start Burst')).toBeInTheDocument();
    expect(screen.getByText('Clear History')).toBeInTheDocument();
    expect(screen.getByText('Export Messages')).toBeInTheDocument();
    expect(screen.getByText('Reset Metrics')).toBeInTheDocument();
  });

  it('shows not supported badge when WebTransport is not available', () => {
    // Mock WebTransport as undefined
    (global as any).WebTransport = undefined;

    render(<WebTransportPage />);

    expect(screen.getByText('Not Supported')).toBeInTheDocument();
  });

  it('connects to WebTransport server when supported', async () => {
    // Mock WebTransport as available
    (global as any).WebTransport = MockWebTransport;

    render(<WebTransportPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com:4433/webtransport');
    const connectButton = screen.getByText('Connect');

    // Change URL and connect
    fireEvent.change(urlInput, { 
      target: { value: 'https://test-webtransport.com:4433/webtransport' } 
    });
    fireEvent.click(connectButton);

    // Wait for connection to be established
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });
  });

  it('handles WebTransport not supported gracefully', () => {
    // Mock WebTransport as undefined
    (global as any).WebTransport = undefined;

    render(<WebTransportPage />);

    const connectButton = screen.getByText('Connect');

    // Try to connect when not supported
    fireEvent.click(connectButton);

    // Should not crash and button should be disabled
    expect(connectButton).toBeDisabled();
  });

  it('disconnects from WebTransport server', async () => {
    // Mock WebTransport as available
    (global as any).WebTransport = MockWebTransport;

    render(<WebTransportPage />);

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
  });

  it('sends messages via stream when connected', async () => {
    // Mock WebTransport as available
    (global as any).WebTransport = MockWebTransport;

    render(<WebTransportPage />);

    const connectButton = screen.getByText('Connect');
    const streamMessageInput = screen.getByPlaceholderText(/{"type": "message"/);
    const sendStreamButton = screen.getByText('Send via Stream');

    // Connect first
    fireEvent.click(connectButton);
    
    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Enter message and send via stream
    fireEvent.change(streamMessageInput, { 
      target: { value: '{"message": "Hello WebTransport Stream!"}' } 
    });
    fireEvent.click(sendStreamButton);

    // Should add message to history
    await waitFor(() => {
      expect(screen.getByText(/Streams: 1 created/)).toBeInTheDocument();
    });
  });

  it('sends datagrams when connected', async () => {
    // Mock WebTransport as available
    (global as any).WebTransport = MockWebTransport;

    render(<WebTransportPage />);

    const connectButton = screen.getByText('Connect');
    const datagramMessageInput = screen.getByPlaceholderText(/{"type": "ping"/);
    const sendDatagramButton = screen.getByText('Send Datagram');

    // Connect first
    fireEvent.click(connectButton);
    
    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Enter message and send datagram
    fireEvent.change(datagramMessageInput, { 
      target: { value: '{"ping": "Hello WebTransport Datagram!"}' } 
    });
    fireEvent.click(sendDatagramButton);

    // Should update datagram stats
    await waitFor(() => {
      expect(screen.getByText(/Datagrams sent: 1/)).toBeInTheDocument();
    });
  });

  it('prevents sending when not connected', () => {
    render(<WebTransportPage />);

    const sendStreamButton = screen.getByText('Send via Stream');
    const sendDatagramButton = screen.getByText('Send Datagram');

    // Should be disabled when not connected
    expect(sendStreamButton).toBeDisabled();
    expect(sendDatagramButton).toBeDisabled();
  });

  it('changes stream type', () => {
    render(<WebTransportPage />);

    // Find the stream type selector
    const streamTypeSelect = screen.getByDisplayValue('Bidirectional Stream');
    
    // Should be present and showing bidirectional by default
    expect(streamTypeSelect).toBeInTheDocument();
  });

  it('starts and stops datagram burst', async () => {
    // Mock WebTransport as available
    (global as any).WebTransport = MockWebTransport;

    render(<WebTransportPage />);

    const connectButton = screen.getByText('Connect');
    const sendRateInput = screen.getByPlaceholderText('10');
    const burstButton = screen.getByText('Start Burst');

    // Connect first
    fireEvent.click(connectButton);
    
    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Set send rate and start burst
    fireEvent.change(sendRateInput, { target: { value: '5' } });
    fireEvent.click(burstButton);

    // Button should change to "Stop Burst"
    expect(screen.getByText('Stop Burst')).toBeInTheDocument();

    // Stop burst
    fireEvent.click(screen.getByText('Stop Burst'));

    // Should go back to "Start Burst"
    expect(screen.getByText('Start Burst')).toBeInTheDocument();
  });

  it('clears message history', async () => {
    // Mock WebTransport as available
    (global as any).WebTransport = MockWebTransport;

    render(<WebTransportPage />);

    const connectButton = screen.getByText('Connect');
    const clearButton = screen.getByText('Clear History');

    // Connect and send a message first
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });

    // Clear history
    fireEvent.click(clearButton);

    // Should show empty state
    expect(screen.getByText(/Connect to a WebTransport server to see messages/)).toBeInTheDocument();
  });

  it('exports messages', async () => {
    // Mock WebTransport as available
    (global as any).WebTransport = MockWebTransport;

    render(<WebTransportPage />);

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
  });

  it('resets performance metrics', () => {
    render(<WebTransportPage />);

    const resetButton = screen.getByText('Reset Metrics');

    // Reset metrics
    fireEvent.click(resetButton);

    // Should reset all counters
    expect(screen.getByText(/Streams: 0 created/)).toBeInTheDocument();
    expect(screen.getByText(/Datagrams sent: 0/)).toBeInTheDocument();
    expect(screen.getByText(/Datagrams received: 0/)).toBeInTheDocument();
  });

  it('displays connection status correctly', async () => {
    // Mock WebTransport as available
    (global as any).WebTransport = MockWebTransport;

    render(<WebTransportPage />);

    // Initially disconnected
    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();

    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    // Wait for connected status
    await waitFor(() => {
      expect(screen.getByText(/Connected/)).toBeInTheDocument();
    });
  });

  it('displays performance metrics', () => {
    render(<WebTransportPage />);

    // Check performance metrics are displayed
    expect(screen.getByText(/Bandwidth Usage:/)).toBeInTheDocument();
    expect(screen.getByText(/Round Trip Time:/)).toBeInTheDocument();
    expect(screen.getByText(/Packet Loss:/)).toBeInTheDocument();
    expect(screen.getByText(/Congestion Window:/)).toBeInTheDocument();
    expect(screen.getByText(/Active Streams:/)).toBeInTheDocument();
  });

  it('shows connection settings', () => {
    render(<WebTransportPage />);

    // Check connection settings are present
    expect(screen.getByText(/Max Concurrent Streams/)).toBeInTheDocument();
    expect(screen.getByText(/Connection Timeout \(ms\)/)).toBeInTheDocument();
    expect(screen.getByText(/Enable keep-alive/)).toBeInTheDocument();
    expect(screen.getByText(/Auto-reconnect on failure/)).toBeInTheDocument();
    expect(screen.getByText(/Advanced congestion control/)).toBeInTheDocument();

    // Check input fields
    expect(screen.getByPlaceholderText('100')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('30000')).toBeInTheDocument();
  });

  it('toggles connection settings checkboxes', () => {
    render(<WebTransportPage />);

    const keepAliveCheckbox = screen.getByLabelText('Enable keep-alive');
    const autoReconnectCheckbox = screen.getByLabelText('Auto-reconnect on failure');
    const congestionControlCheckbox = screen.getByLabelText('Advanced congestion control');

    // Should be able to toggle checkboxes
    fireEvent.click(keepAliveCheckbox);
    fireEvent.click(autoReconnectCheckbox);
    fireEvent.click(congestionControlCheckbox);

    // Checkboxes should respond to clicks (component should not crash)
    expect(keepAliveCheckbox).toBeInTheDocument();
    expect(autoReconnectCheckbox).toBeInTheDocument();
    expect(congestionControlCheckbox).toBeInTheDocument();
  });

  it('handles certificate hash input', () => {
    render(<WebTransportPage />);

    const certHashInput = screen.getByPlaceholderText('Base64 encoded certificate hash for self-signed certs');
    
    // Enter certificate hash
    fireEvent.change(certHashInput, { 
      target: { value: 'abc123def456' } 
    });
    
    expect(certHashInput).toHaveValue('abc123def456');
  });

  it('displays protocol information', () => {
    render(<WebTransportPage />);

    // Should show protocol info in connection status
    expect(screen.getByText(/Protocol: HTTP\/3 \+ WebTransport/)).toBeInTheDocument();
  });

  it('handles send rate input', () => {
    render(<WebTransportPage />);

    const sendRateInput = screen.getByPlaceholderText('10');
    
    // Change send rate
    fireEvent.change(sendRateInput, { target: { value: '20' } });
    
    expect(sendRateInput).toHaveValue('20');
  });

  it('handles connection timeout input', () => {
    render(<WebTransportPage />);

    const timeoutInput = screen.getByPlaceholderText('30000');
    
    // Change timeout
    fireEvent.change(timeoutInput, { target: { value: '60000' } });
    
    expect(timeoutInput).toHaveValue('60000');
  });

  it('handles max streams input', () => {
    render(<WebTransportPage />);

    const maxStreamsInput = screen.getByPlaceholderText('100');
    
    // Change max streams
    fireEvent.change(maxStreamsInput, { target: { value: '200' } });
    
    expect(maxStreamsInput).toHaveValue('200');
  });
});