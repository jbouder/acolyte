import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MarkdownPreviewPage from '../app/markdown-preview/page';

// Mock react-markdown
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-preview">{children}</div>;
  };
});

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

describe('Markdown Preview Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders markdown preview page with default content', () => {
    render(<MarkdownPreviewPage />);

    expect(screen.getByText('Markdown Preview')).toBeInTheDocument();
    expect(screen.getByText('Markdown Editor')).toBeInTheDocument();
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Type your Markdown here...'),
    ).toBeInTheDocument();
  });

  it('renders default markdown content', () => {
    render(<MarkdownPreviewPage />);

    const textarea = screen.getByPlaceholderText('Type your Markdown here...');
    expect(textarea.value).toContain('# Welcome to Markdown Preview');
  });

  it('updates markdown content when typing in textarea', () => {
    render(<MarkdownPreviewPage />);

    const textarea = screen.getByPlaceholderText('Type your Markdown here...');
    fireEvent.change(textarea, {
      target: { value: '# New Title\n\nNew content' },
    });

    expect(textarea).toHaveValue('# New Title\n\nNew content');
  });

  it('shows character and line count', () => {
    render(<MarkdownPreviewPage />);

    expect(screen.getByText(/Characters:/)).toBeInTheDocument();
    expect(screen.getByText(/Lines:/)).toBeInTheDocument();
  });

  it('copies markdown to clipboard when copy button is clicked', async () => {
    const { toast } = require('sonner');

    render(<MarkdownPreviewPage />);

    const copyButton = screen.getByText('Copy MD');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
    });
  });

  it('clears content when clear button is clicked', () => {
    const { toast } = require('sonner');

    render(<MarkdownPreviewPage />);

    const textarea = screen.getByPlaceholderText('Type your Markdown here...');
    const clearButton = screen.getByText('Clear');

    fireEvent.click(clearButton);

    expect(textarea).toHaveValue('');
    expect(toast.info).toHaveBeenCalledWith('Cleared all content');
  });

  it('handles file upload correctly', () => {
    const { toast } = require('sonner');

    render(<MarkdownPreviewPage />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['# Test Content'], 'test.md', {
      type: 'text/markdown',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Wait for FileReader to process
    setTimeout(() => {
      expect(toast.success).toHaveBeenCalledWith('File loaded successfully!');
    }, 100);
  });

  it('rejects invalid file types', () => {
    const { toast } = require('sonner');

    render(<MarkdownPreviewPage />);

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
      'Please select a .md or .txt file',
    );
  });

  it('triggers download when export button is clicked', () => {
    const { toast } = require('sonner');

    render(<MarkdownPreviewPage />);

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

    expect(mockAnchor.download).toBe('document.md');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Markdown file downloaded!');

    // Restore original methods
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
  });
});
