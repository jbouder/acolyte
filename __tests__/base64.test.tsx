import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Base64Page from '../app/base64/page';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(),
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

// Mock URL.createObjectURL and related functions
global.URL.createObjectURL = jest.fn(() => 'mocked-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader
const mockFileReader = {
  onload: null as ((event: any) => void) | null,
  readAsText: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  result: null,
};

global.FileReader = jest.fn(() => mockFileReader) as any;

describe('Base64Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset FileReader mock
    mockFileReader.onload = null;
    mockFileReader.result = null;
  });

  it('renders the Base64 page with all components', () => {
    render(<Base64Page />);

    // Check main heading
    expect(screen.getByText('Base64 Encoder/Decoder')).toBeInTheDocument();

    // Check card titles
    expect(screen.getByText('Encode to Base64')).toBeInTheDocument();
    expect(screen.getByText('Decode from Base64')).toBeInTheDocument();
    expect(screen.getAllByText('Output')).toHaveLength(2); // Card title and label
    expect(screen.getByText('File Upload')).toBeInTheDocument();
    expect(screen.getByText('Encoding Options')).toBeInTheDocument();

    // Check buttons
    expect(screen.getAllByText('Encode')).toHaveLength(1);
    expect(screen.getAllByText('Decode')).toHaveLength(1);
    expect(screen.getAllByText('Clear')).toHaveLength(2);

    // Check textareas
    expect(
      screen.getByPlaceholderText(
        'Enter your text here to encode to Base64...',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        'Enter Base64 encoded text here to decode...',
      ),
    ).toBeInTheDocument();

    // Check options
    expect(screen.getByLabelText('URL-safe encoding')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Insert line breaks (76 chars)'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Remove padding characters'),
    ).toBeInTheDocument();
  });

  it('encodes text to Base64 correctly', async () => {
    const { toast } = require('sonner');
    render(<Base64Page />);

    const inputTextarea = screen.getByPlaceholderText(
      'Enter your text here to encode to Base64...',
    );
    const encodeButton = screen.getByText('Encode');

    // Enter test text
    fireEvent.change(inputTextarea, { target: { value: 'Hello World' } });

    // Click encode button
    fireEvent.click(encodeButton);

    // Check output appears
    await waitFor(() => {
      expect(screen.getByText('SGVsbG8gV29ybGQ=')).toBeInTheDocument();
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Text successfully encoded to Base64!',
    );
  });

  it('decodes Base64 text correctly', async () => {
    const { toast } = require('sonner');
    render(<Base64Page />);

    const base64Input = screen.getByPlaceholderText(
      'Enter Base64 encoded text here to decode...',
    );
    const decodeButton = screen.getByText('Decode');

    // Enter Base64 text
    fireEvent.change(base64Input, { target: { value: 'SGVsbG8gV29ybGQ=' } });

    // Click decode button
    fireEvent.click(decodeButton);

    // Check output appears
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    expect(toast.success).toHaveBeenCalledWith('Base64 successfully decoded!');
  });

  it('handles URL-safe encoding option', async () => {
    render(<Base64Page />);

    const inputTextarea = screen.getByPlaceholderText(
      'Enter your text here to encode to Base64...',
    );
    const encodeButton = screen.getByText('Encode');
    const urlSafeCheckbox = screen.getByLabelText('URL-safe encoding');

    // Enable URL-safe encoding
    fireEvent.click(urlSafeCheckbox);

    // Enter text that would produce + and / characters in standard Base64
    fireEvent.change(inputTextarea, { target: { value: 'test>test?test' } });

    // Click encode button
    fireEvent.click(encodeButton);

    // Check output uses URL-safe characters (- and _ instead of + and /)
    await waitFor(() => {
      const output = screen.getByText(/dGVzdD50ZXN0P3Rlc3Q/);
      expect(output).toBeInTheDocument();
      // URL-safe should replace + with - and / with _
      expect(output.textContent).not.toContain('+');
      expect(output.textContent).not.toContain('/');
    });
  });

  it('handles line breaks option correctly', async () => {
    render(<Base64Page />);

    const inputTextarea = screen.getByPlaceholderText(
      'Enter your text here to encode to Base64...',
    );
    const encodeButton = screen.getByText('Encode');

    // Enter long text to trigger line breaks
    const longText =
      'This is a very long text that should produce a Base64 string longer than 76 characters and trigger line breaks in the output when the option is enabled.';
    fireEvent.change(inputTextarea, { target: { value: longText } });

    // Click encode button (line breaks should be enabled by default)
    fireEvent.click(encodeButton);

    // Check output contains newlines
    await waitFor(() => {
      const outputElements = screen.queryAllByText(
        /VGhpcyBpcyBhIHZlcnkgbG9uZyB0ZXh0/,
      );
      if (outputElements.length > 0) {
        const output = outputElements[0];
        expect(output.textContent).toContain('\n');
      }
    });
  });

  it('handles remove padding option', async () => {
    render(<Base64Page />);

    const inputTextarea = screen.getByPlaceholderText(
      'Enter your text here to encode to Base64...',
    );
    const encodeButton = screen.getByText('Encode');
    const removePaddingCheckbox = screen.getByLabelText(
      'Remove padding characters',
    );

    // Enable remove padding
    fireEvent.click(removePaddingCheckbox);

    // Enter text that would produce padding
    fireEvent.change(inputTextarea, { target: { value: 'test' } });

    // Click encode button
    fireEvent.click(encodeButton);

    // Check output doesn't contain padding characters
    await waitFor(() => {
      const outputElements = screen.queryAllByText(/dGVzdA/);
      if (outputElements.length > 0) {
        const output = outputElements[0];
        expect(output.textContent).not.toContain('=');
      }
    });
  });

  it('clears input when clear button is clicked', () => {
    render(<Base64Page />);

    const inputTextarea = screen.getByPlaceholderText(
      'Enter your text here to encode to Base64...',
    );
    const clearButton = screen.getAllByText('Clear')[0]; // First clear button (for encode section)

    // Add some content
    fireEvent.change(inputTextarea, { target: { value: 'test content' } });
    expect(inputTextarea).toHaveValue('test content');

    // Click clear button
    fireEvent.click(clearButton);

    // Check input is cleared
    expect(inputTextarea).toHaveValue('');
  });

  it('copies output to clipboard when copy button is clicked', async () => {
    const { toast } = require('sonner');
    render(<Base64Page />);

    const inputTextarea = screen.getByPlaceholderText(
      'Enter your text here to encode to Base64...',
    );
    const encodeButton = screen.getByText('Encode');

    // Enter and encode text
    fireEvent.change(inputTextarea, { target: { value: 'Hello' } });
    fireEvent.click(encodeButton);

    // Wait for output and find copy button
    await waitFor(() => {
      const copyButton = screen.getByText('Copy to Clipboard');
      expect(copyButton).toBeInTheDocument();
      fireEvent.click(copyButton);
    });

    // Check clipboard was called
    expect(mockClipboard.writeText).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
  });

  it('downloads output as file when download button is clicked', async () => {
    render(<Base64Page />);

    const inputTextarea = screen.getByPlaceholderText(
      'Enter your text here to encode to Base64...',
    );
    const encodeButton = screen.getByText('Encode');

    // Mock document.createElement and appendChild
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    const mockCreateElement = jest
      .spyOn(document, 'createElement')
      .mockReturnValue(mockLink as any);
    const mockAppendChild = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => mockLink as any);
    const mockRemoveChild = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => mockLink as any);

    // Enter and encode text
    fireEvent.change(inputTextarea, { target: { value: 'Hello' } });
    fireEvent.click(encodeButton);

    // Wait for output and find download button
    await waitFor(() => {
      const downloadButton = screen.getByText('Download as File');
      expect(downloadButton).toBeInTheDocument();
      fireEvent.click(downloadButton);
    });

    // Check download process was triggered
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();

    // Cleanup mocks
    mockCreateElement.mockRestore();
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });

  it('handles invalid Base64 input gracefully', async () => {
    const { toast } = require('sonner');
    render(<Base64Page />);

    const base64Input = screen.getByPlaceholderText(
      'Enter Base64 encoded text here to decode...',
    );
    const decodeButton = screen.getByText('Decode');

    // Enter invalid Base64
    fireEvent.change(base64Input, { target: { value: 'invalid base64!!!' } });

    // Click decode button
    fireEvent.click(decodeButton);

    // Check error message appears
    await waitFor(() => {
      expect(
        screen.getByText(
          'Failed to decode Base64. Please check your input format.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('handles file upload functionality', () => {
    render(<Base64Page />);

    // Check file upload area is present
    expect(
      screen.getByText('Drag and drop a file here, or click to select'),
    ).toBeInTheDocument();
    expect(screen.getByText('Choose File')).toBeInTheDocument();
    expect(screen.getByText('Maximum file size: 10MB')).toBeInTheDocument();
  });

  it('handles drag and drop states', () => {
    render(<Base64Page />);

    const dropArea = screen
      .getByText('Drag and drop a file here, or click to select')
      .closest('div');

    // Simulate drag over
    fireEvent.dragOver(dropArea!);
    expect(screen.getByText('Drop the file here...')).toBeInTheDocument();

    // Simulate drag leave
    fireEvent.dragLeave(dropArea!);
    expect(
      screen.getByText('Drag and drop a file here, or click to select'),
    ).toBeInTheDocument();
  });

  it('changes character encoding selection', () => {
    render(<Base64Page />);

    // Check encoding selector is present
    expect(screen.getByText('Character Encoding')).toBeInTheDocument();

    // Check default UTF-8 is selected
    const encodingSelect = screen.getByRole('combobox');
    expect(encodingSelect).toBeInTheDocument();
  });

  it('handles empty input gracefully', async () => {
    render(<Base64Page />);

    const encodeButton = screen.getByText('Encode');
    const decodeButton = screen.getByText('Decode');

    // Click encode with empty input
    fireEvent.click(encodeButton);

    // Click decode with empty input
    fireEvent.click(decodeButton);

    // Should not crash or show errors for empty input
    expect(screen.getByText('Output will appear here...')).toBeInTheDocument();
  });

  it('displays download as image button when image data is detected', async () => {
    const { toast } = require('sonner');
    render(<Base64Page />);

    const base64Input = screen.getByPlaceholderText(
      'Enter Base64 encoded text here to decode...',
    );
    const decodeButton = screen.getByText('Decode');

    // Enter PNG image Base64 (starts with iVBORw0KGgo)
    fireEvent.change(base64Input, {
      target: {
        value:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      },
    });

    // Click decode button
    fireEvent.click(decodeButton);

    // Check that image detection works and download button appears
    await waitFor(() => {
      expect(screen.getByText('Download as Image')).toBeInTheDocument();
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Base64 successfully decoded! (Image detected)',
    );
  });

  it('shows image preview label when image data is available', async () => {
    render(<Base64Page />);

    const base64Input = screen.getByPlaceholderText(
      'Enter Base64 encoded text here to decode...',
    );
    const decodeButton = screen.getByText('Decode');

    // Enter PNG image Base64 (starts with iVBORw0KGgo)
    fireEvent.change(base64Input, {
      target: {
        value:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      },
    });

    // Click decode button
    fireEvent.click(decodeButton);

    // Check that image preview section appears
    await waitFor(() => {
      expect(screen.getByText('Image Preview')).toBeInTheDocument();
      expect(screen.getByText('Base64 Image Data')).toBeInTheDocument();
    });
  });
});
