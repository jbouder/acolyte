import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MermaidViewerPage from '../app/mermaid-preview/page';

// Mock mermaid
jest.mock('mermaid', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn(() =>
      Promise.resolve({ svg: '<svg data-testid="mermaid-svg"></svg>' }),
    ),
  },
}));

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(() => Promise.resolve()),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

describe('Mermaid Preview Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mermaid preview page with default content', () => {
    render(<MermaidViewerPage />);

    expect(screen.getByText('Mermaid Preview')).toBeInTheDocument();
    expect(screen.getByText('Mermaid Editor')).toBeInTheDocument();
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Type your Mermaid code here...'),
    ).toBeInTheDocument();
  });

  it('renders default mermaid content', () => {
    render(<MermaidViewerPage />);

    const textarea = screen.getByPlaceholderText(
      'Type your Mermaid code here...',
    );
    expect(textarea.value).toContain('graph TD');
  });

  it('updates mermaid content when typing in textarea', () => {
    render(<MermaidViewerPage />);

    const textarea = screen.getByPlaceholderText(
      'Type your Mermaid code here...',
    );
    fireEvent.change(textarea, {
      target: { value: 'graph LR\n    A --> B' },
    });

    expect(textarea).toHaveValue('graph LR\n    A --> B');
  });

  it('shows character and line count', () => {
    render(<MermaidViewerPage />);

    expect(screen.getByText(/Characters:/)).toBeInTheDocument();
    expect(screen.getByText(/Lines:/)).toBeInTheDocument();
  });

  it('copies mermaid code to clipboard when copy button is clicked', async () => {
    const toast = jest.mocked((await import('sonner')).toast);

    render(<MermaidViewerPage />);

    const copyButton = screen.getByText('Copy Code');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });
  });

  it('clears content when clear button is clicked', async () => {
    const toast = jest.mocked((await import('sonner')).toast);

    render(<MermaidViewerPage />);

    const textarea = screen.getByPlaceholderText(
      'Type your Mermaid code here...',
    );
    const clearButton = screen.getByText('Clear');

    fireEvent.click(clearButton);

    expect(textarea).toHaveValue('');
    expect(toast.info).toHaveBeenCalledWith('Cleared all content');
  });

  it('handles file upload correctly', async () => {
    const toast = jest.mocked((await import('sonner')).toast);

    render(<MermaidViewerPage />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['graph TD\n    A --> B'], 'test.mmd', {
      type: 'text/plain',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Wait for FileReader to process
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('File loaded successfully!');
    });
  });

  it('rejects invalid file types', async () => {
    const toast = jest.mocked((await import('sonner')).toast);

    render(<MermaidViewerPage />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(toast.error).toHaveBeenCalledWith(
      'Please select a .mmd, .mermaid, or .txt file',
    );
  });

  it('triggers download when export button is clicked', async () => {
    const toast = jest.mocked((await import('sonner')).toast);

    render(<MermaidViewerPage />);

    // Mock document.createElement and related methods after render
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn(),
    };

    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') return mockAnchor as any;
      return originalCreateElement.call(document, tagName);
    });

    const originalAppendChild = document.body.appendChild;
    const originalRemoveChild = document.body.removeChild;
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    expect(mockAnchor.download).toBe('diagram.mmd');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Mermaid file downloaded!');

    // Restore original methods
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
  });
});
