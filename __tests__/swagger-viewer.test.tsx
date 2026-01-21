import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SwaggerViewerPage from '../app/swagger-viewer/page';

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('SwaggerViewerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Swagger Viewer page with all components', () => {
    render(<SwaggerViewerPage />);

    // Check main heading
    expect(screen.getByText('Swagger Viewer')).toBeInTheDocument();

    // Check card titles
    expect(
      screen.getByText('OpenAPI / Swagger Specification'),
    ).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Upload JSON File')).toBeInTheDocument();
    expect(screen.getByText('Load Example')).toBeInTheDocument();
    expect(screen.getByText('Parse API Docs')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();

    // Check textarea
    expect(
      screen.getByPlaceholderText('Paste your OpenAPI/Swagger JSON here...'),
    ).toBeInTheDocument();
  });

  it('loads example specification when Load Example button is clicked', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SwaggerViewerPage />);

    const loadExampleButton = screen.getByText('Load Example');
    const textarea = screen.getByPlaceholderText(
      'Paste your OpenAPI/Swagger JSON here...',
    );

    // Click load example button
    fireEvent.click(loadExampleButton);

    // Check that textarea is populated
    await waitFor(() => {
      expect(textarea).not.toHaveValue('');
      expect(textarea.value).toContain('openapi');
      expect(textarea.value).toContain('Sample API');
    });

    // Check success toast was called
    expect(toast.success).toHaveBeenCalledWith('Example loaded!');
  });

  it('enables Parse API Docs button when JSON is entered', () => {
    render(<SwaggerViewerPage />);

    const textarea = screen.getByPlaceholderText(
      'Paste your OpenAPI/Swagger JSON here...',
    );
    const renderButton = screen.getByText('Parse API Docs');

    // Initially disabled
    expect(renderButton).toBeDisabled();

    // Enter some text
    fireEvent.change(textarea, { target: { value: '{"test": "data"}' } });

    // Should be enabled now
    expect(renderButton).toBeEnabled();
  });

  it('shows error for invalid JSON format', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SwaggerViewerPage />);

    const textarea = screen.getByPlaceholderText(
      'Paste your OpenAPI/Swagger JSON here...',
    );
    const renderButton = screen.getByText('Parse API Docs');

    // Enter invalid JSON
    fireEvent.change(textarea, { target: { value: '{invalid json}' } });
    fireEvent.click(renderButton);

    // Check error message appears
    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON:/)).toBeInTheDocument();
    });

    // Check error toast was called
    expect(toast.error).toHaveBeenCalledWith('Failed to parse JSON');
  });

  it('shows error for JSON missing OpenAPI/Swagger properties', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SwaggerViewerPage />);

    const textarea = screen.getByPlaceholderText(
      'Paste your OpenAPI/Swagger JSON here...',
    );
    const renderButton = screen.getByText('Parse API Docs');

    // Enter valid JSON but without openapi or swagger property
    fireEvent.change(textarea, {
      target: { value: '{"someProperty": "value"}' },
    });
    fireEvent.click(renderButton);

    // Check error message appears
    await waitFor(() => {
      expect(
        screen.getByText(/Invalid OpenAPI\/Swagger format/),
      ).toBeInTheDocument();
    });

    // Check error toast was called
    expect(toast.error).toHaveBeenCalledWith('Invalid OpenAPI/Swagger format');
  });

  it('clears all fields when clear button is clicked', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SwaggerViewerPage />);

    const textarea = screen.getByPlaceholderText(
      'Paste your OpenAPI/Swagger JSON here...',
    );
    const clearButton = screen.getByText('Clear');

    // Add some content
    fireEvent.change(textarea, {
      target: { value: '{"openapi": "3.0.0"}' },
    });

    // Click clear button
    fireEvent.click(clearButton);

    // Check textarea is cleared
    expect(textarea).toHaveValue('');

    // Check toast was called
    expect(toast.info).toHaveBeenCalledWith('Cleared all fields');
  });

  it('displays character and line count for input', () => {
    render(<SwaggerViewerPage />);

    const textarea = screen.getByPlaceholderText(
      'Paste your OpenAPI/Swagger JSON here...',
    );

    // Enter some text
    const testText = '{\n  "test": "value"\n}';
    fireEvent.change(textarea, { target: { value: testText } });

    // Check stats are displayed
    expect(screen.getByText(/Characters:/)).toBeInTheDocument();
    expect(screen.getByText(/Lines:/)).toBeInTheDocument();
  });

  it('accepts file upload with .json extension', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SwaggerViewerPage />);

    const uploadButton = screen.getByText('Upload JSON File');
    fireEvent.click(uploadButton);

    // Find the hidden file input
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Create a mock file
    const file = new File(
      ['{"openapi": "3.0.0", "info": {"title": "Test API"}}'],
      'test.json',
      { type: 'application/json' },
    );

    // Simulate file upload
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Wait for file to be read
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('File uploaded successfully!');
    });
  });

  it('rejects file upload without .json extension', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SwaggerViewerPage />);

    const uploadButton = screen.getByText('Upload JSON File');
    fireEvent.click(uploadButton);

    // Find the hidden file input
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Create a mock file with wrong extension
    const file = new File(['some content'], 'test.txt', { type: 'text/plain' });

    // Simulate file upload
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    // Check error toast was called
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Invalid file type. Please upload a JSON file.',
      );
    });
  });

  it('displays endpoints in tables grouped by tags', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<SwaggerViewerPage />);

    const textarea = screen.getByPlaceholderText(
      'Paste your OpenAPI/Swagger JSON here...',
    );
    const parseButton = screen.getByText('Parse API Docs');

    // Enter valid OpenAPI spec with endpoints
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'Test API Description',
      },
      paths: {
        '/users': {
          get: {
            summary: 'Get all users',
            tags: ['Users'],
          },
          post: {
            summary: 'Create user',
            tags: ['Users'],
          },
        },
        '/products': {
          get: {
            summary: 'Get all products',
            tags: ['Products'],
          },
        },
      },
    };

    fireEvent.change(textarea, { target: { value: JSON.stringify(spec) } });
    fireEvent.click(parseButton);

    // Check success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'API documentation parsed successfully!',
      );
    });

    // Check that API title is displayed
    expect(screen.getByText('Test API')).toBeInTheDocument();
    expect(screen.getByText('Version: 1.0.0')).toBeInTheDocument();

    // Check that tags are displayed as headers
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();

    // Check that endpoints are displayed
    expect(screen.getByText('Get all users')).toBeInTheDocument();
    expect(screen.getByText('Create user')).toBeInTheDocument();
    expect(screen.getByText('Get all products')).toBeInTheDocument();

    // Check that methods are displayed
    expect(screen.getAllByText('GET')).toHaveLength(2);
    expect(screen.getByText('POST')).toBeInTheDocument();

    // Check that paths are displayed
    expect(screen.getAllByText('/users')).toHaveLength(2); // GET and POST
    expect(screen.getByText('/products')).toBeInTheDocument();
  });
});
