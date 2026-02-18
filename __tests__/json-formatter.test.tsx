import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import JsonFormatterPage from '../app/json-formatter/page';

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

describe('JsonFormatterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the JSON Formatter page with all components', () => {
    render(<JsonFormatterPage />);

    // Check main heading
    expect(screen.getByText('JSON Formatter')).toBeInTheDocument();

    // Check card titles
    expect(screen.getByText('Input JSON')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Format')).toBeInTheDocument();
    expect(screen.getByText('Minify')).toBeInTheDocument();
    expect(screen.getByText('Validate')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();

    // Check input textarea
    expect(
      screen.getByPlaceholderText('Paste your JSON here...'),
    ).toBeInTheDocument();

    // Check output textarea
    expect(
      screen.getByPlaceholderText('Output will appear here...'),
    ).toBeInTheDocument();

    // Check indent selector
    expect(screen.getByText('Indent:')).toBeInTheDocument();

    // Check sort keys checkbox
    expect(screen.getByLabelText('Sort keys')).toBeInTheDocument();
  });

  it('formats JSON correctly with default settings', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<JsonFormatterPage />);

    const input = screen.getByPlaceholderText('Paste your JSON here...');
    const formatButton = screen.getByText('Format');
    const output = screen.getByPlaceholderText('Output will appear here...');

    // Enter valid JSON
    const testJson = '{"name":"John","age":30,"city":"New York"}';
    fireEvent.change(input, { target: { value: testJson } });

    // Click format button
    fireEvent.click(formatButton);

    // Check output is formatted with default 2-space indentation
    await waitFor(() => {
      expect(output).toHaveValue(
        '{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}',
      );
    });

    // Check success toast was called
    expect(toast.success).toHaveBeenCalledWith('JSON formatted successfully!');
  });

  it('handles invalid JSON with proper error display', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<JsonFormatterPage />);

    const input = screen.getByPlaceholderText('Paste your JSON here...');
    const formatButton = screen.getByText('Format');

    // Enter invalid JSON
    fireEvent.change(input, { target: { value: '{"name": John}' } });

    // Click format button
    fireEvent.click(formatButton);

    // Check error message appears
    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON:/)).toBeInTheDocument();
    });

    // Check error toast was called
    expect(toast.error).toHaveBeenCalledWith('Invalid JSON format');
  });

  it('minifies JSON correctly', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<JsonFormatterPage />);

    const input = screen.getByPlaceholderText('Paste your JSON here...');
    const minifyButton = screen.getByText('Minify');
    const output = screen.getByPlaceholderText('Output will appear here...');

    // Enter formatted JSON
    const testJson = '{\n  "name": "John",\n  "age": 30\n}';
    fireEvent.change(input, { target: { value: testJson } });

    // Click minify button
    fireEvent.click(minifyButton);

    // Check output is minified
    await waitFor(() => {
      expect(output).toHaveValue('{"name":"John","age":30}');
    });

    expect(toast.success).toHaveBeenCalledWith('JSON minified successfully!');
  });

  it('validates JSON correctly for valid input', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<JsonFormatterPage />);

    const input = screen.getByPlaceholderText('Paste your JSON here...');
    const validateButton = screen.getByText('Validate');

    // Enter valid JSON
    fireEvent.change(input, { target: { value: '{"valid": true}' } });

    // Click validate button
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Valid JSON!');
    });
  });

  it('sorts JSON keys when option is enabled', async () => {
    render(<JsonFormatterPage />);

    const input = screen.getByPlaceholderText('Paste your JSON here...');
    const sortKeysCheckbox = screen.getByLabelText('Sort keys');
    const formatButton = screen.getByText('Format');
    const output = screen.getByPlaceholderText('Output will appear here...');

    // Enable sort keys
    fireEvent.click(sortKeysCheckbox);

    // Enter JSON with unsorted keys
    const testJson = '{"zebra":"animal","apple":"fruit","banana":"fruit"}';
    fireEvent.change(input, { target: { value: testJson } });

    // Click format button
    fireEvent.click(formatButton);

    // Check output has sorted keys
    await waitFor(() => {
      expect(output).toHaveValue(
        '{\n  "apple": "fruit",\n  "banana": "fruit",\n  "zebra": "animal"\n}',
      );
    });
  });

  it('changes indentation based on selection', async () => {
    render(<JsonFormatterPage />);

    const input = screen.getByPlaceholderText('Paste your JSON here...');
    const formatButton = screen.getByText('Format');
    const output = screen.getByPlaceholderText('Output will appear here...');

    // Enter test JSON
    const testJson = '{"name":"John"}';
    fireEvent.change(input, { target: { value: testJson } });

    // Change indentation to 4 spaces
    const indentSelect = screen.getByRole('combobox');
    fireEvent.click(indentSelect);
    fireEvent.click(screen.getByText('4'));

    // Click format button
    fireEvent.click(formatButton);

    // Check output uses 4-space indentation
    await waitFor(() => {
      expect(output).toHaveValue('{\n    "name": "John"\n}');
    });
  });

  it('clears all fields when clear button is clicked', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<JsonFormatterPage />);

    const input = screen.getByPlaceholderText('Paste your JSON here...');
    const clearButton = screen.getByText('Clear');

    // Add some content
    fireEvent.change(input, { target: { value: '{"test": true}' } });

    // Click clear button
    fireEvent.click(clearButton);

    // Check input is cleared
    expect(input).toHaveValue('');

    // Check toast was called
    expect(toast.info).toHaveBeenCalledWith('Cleared all fields');
  });

  it('copies output to clipboard when copy button is clicked', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<JsonFormatterPage />);

    const input = screen.getByPlaceholderText('Paste your JSON here...');
    const formatButton = screen.getByText('Format');

    // Enter and format JSON
    fireEvent.change(input, { target: { value: '{"test": true}' } });
    fireEvent.click(formatButton);

    // Wait for output and find copy button
    await waitFor(() => {
      const copyButton = screen.getByText('Copy');
      expect(copyButton).toBeInTheDocument();
      fireEvent.click(copyButton);
    });

    // Check clipboard was called
    expect(mockClipboard.writeText).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
  });

  it('handles nested objects and arrays correctly', async () => {
    render(<JsonFormatterPage />);

    const input = screen.getByPlaceholderText('Paste your JSON here...');
    const formatButton = screen.getByText('Format');
    const output = screen.getByPlaceholderText('Output will appear here...');

    // Enter complex nested JSON
    const complexJson =
      '{"users":[{"name":"John","roles":["admin","user"]},{"name":"Jane","roles":["user"]}],"config":{"theme":"dark","notifications":true}}';
    fireEvent.change(input, { target: { value: complexJson } });

    // Click format button
    fireEvent.click(formatButton);

    // Check output is properly formatted
    await waitFor(() => {
      const formattedOutput = output.value;
      expect(formattedOutput).toContain('"users": [');
      expect(formattedOutput).toContain('"roles": [');
      expect(formattedOutput).toContain('"config": {');
      expect(formattedOutput.split('\n').length).toBeGreaterThan(10); // Should be multi-line
    });
  });

  it('displays character and line count for output', async () => {
    render(<JsonFormatterPage />);

    const input = screen.getByPlaceholderText('Paste your JSON here...');
    const formatButton = screen.getByText('Format');

    // Enter and format JSON
    fireEvent.change(input, { target: { value: '{"test": true}' } });
    fireEvent.click(formatButton);

    // Check stats are displayed
    await waitFor(() => {
      expect(screen.getByText(/Characters:/)).toBeInTheDocument();
      expect(screen.getByText(/Lines:/)).toBeInTheDocument();
    });
  });
});
