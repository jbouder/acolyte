import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WebStatsPage from '../app/website-analysis/page';

// Mock fetch for website analysis API
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        url: 'https://example.com',
        domain: 'example.com',
        protocol: 'https:',
        statusCode: 200,
        statusText: 'OK',
        responseTime: 250,
        timestamp: '2024-01-01T00:00:00.000Z',
        content: {
          title: 'Example Domain',
          description: 'This domain is for use in illustrative examples',
          contentLength: 1024,
          htmlSizeKB: 2.5,
          wordCount: 150,
          charCount: 1024,
          linkCount: 5,
          imageCount: 2,
          scriptCount: 3,
          styleCount: 1,
          cssLinkCount: 2,
        },
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'cache-control': 'max-age=3600',
          server: 'nginx/1.18.0',
        },
        securityHeaders: {
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
          'content-security-policy': "default-src 'self'",
          'x-frame-options': 'DENY',
          'x-content-type-options': 'nosniff',
        },
        frameworks: {
          react: true,
          vue: false,
          angular: false,
          jquery: true,
          bootstrap: false,
          tailwind: true,
        },
        analytics: {
          googleAnalytics: true,
          googleTagManager: false,
          facebookPixel: false,
          hotjar: false,
          matomo: false,
          mixpanel: false,
          amplitude: false,
          segment: false,
          intercom: false,
          zendesk: false,
          crazyEgg: false,
          fullStory: false,
          linkedInInsight: false,
          twitterPixel: false,
        },
        metaTags: [
          { name: 'description', content: 'This domain is for use in illustrative examples' },
          { name: 'viewport', content: 'width=device-width, initial-scale=1' },
          { name: 'author', content: 'IANA' },
        ],
      }),
  })
) as jest.Mock;

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('WebStatsPage', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Website Analysis page with all components', () => {
    render(<WebStatsPage />);

    // Check main heading
    expect(screen.getByText('Website Analysis')).toBeInTheDocument();

    // Check card title
    expect(screen.getByText('Website Analyzer')).toBeInTheDocument();

    // Check input field
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();

    // Check analyze button
    expect(screen.getByText('Analyze')).toBeInTheDocument();

    // Check description
    expect(screen.getByText(/Enter a URL to get detailed statistics/)).toBeInTheDocument();
  });

  it('analyzes a website successfully', async () => {
    const { toast } = require('sonner');
    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Enter URL and analyze
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(analyzeButton);

    // Should show analyzing state
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    // Check that analysis results are displayed
    expect(screen.getByText('200')).toBeInTheDocument(); // Status code
    expect(screen.getByText('OK')).toBeInTheDocument(); // Status text
    expect(screen.getByText('250ms')).toBeInTheDocument(); // Response time
    expect(screen.getByText('Example Domain')).toBeInTheDocument(); // Title

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('/api/website-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    expect(toast.success).toHaveBeenCalledWith('Website analysis completed!');
  });

  it('handles analysis errors gracefully', async () => {
    const { toast } = require('sonner');
    // Mock failed fetch
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Enter URL and analyze
    fireEvent.change(urlInput, { target: { value: 'https://invalid-url.com' } });
    fireEvent.click(analyzeButton);

    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to analyze website');
  });

  it('handles empty URL input', () => {
    const { toast } = require('sonner');
    render(<WebStatsPage />);

    const analyzeButton = screen.getByText('Analyze');

    // Try to analyze without URL
    fireEvent.click(analyzeButton);

    expect(toast.error).toHaveBeenCalledWith('Please enter a valid URL');
  });

  it('handles Enter key press in URL input', async () => {
    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');

    // Enter URL and press Enter
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.keyDown(urlInput, { key: 'Enter', code: 'Enter' });

    // Should start analysis
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
  });

  it('displays content statistics correctly', async () => {
    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Analyze website
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(analyzeButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Content Analysis')).toBeInTheDocument();
    });

    // Check content statistics
    expect(screen.getByText(/2\.5/)).toBeInTheDocument(); // HTML size
    expect(screen.getByText(/150/)).toBeInTheDocument(); // Word count
    expect(screen.getByText(/1024/)).toBeInTheDocument(); // Character count
    expect(screen.getByText(/5/)).toBeInTheDocument(); // Link count
    expect(screen.getByText(/2/)).toBeInTheDocument(); // Image count
    expect(screen.getByText(/3/)).toBeInTheDocument(); // Script count
  });

  it('displays detected frameworks and libraries', async () => {
    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Analyze website
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(analyzeButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Technologies')).toBeInTheDocument();
    });

    // Check detected frameworks
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('jQuery')).toBeInTheDocument();
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument();
  });

  it('displays analytics tools', async () => {
    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Analyze website
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(analyzeButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Analytics & Tracking')).toBeInTheDocument();
    });

    // Check analytics tools
    expect(screen.getByText('Google Analytics')).toBeInTheDocument();
  });

  it('displays security headers', async () => {
    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Analyze website
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(analyzeButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Security Headers')).toBeInTheDocument();
    });

    // Check security headers
    expect(screen.getByText('Strict-Transport-Security')).toBeInTheDocument();
    expect(screen.getByText('Content-Security-Policy')).toBeInTheDocument();
    expect(screen.getByText('X-Frame-Options')).toBeInTheDocument();
  });

  it('displays meta tags', async () => {
    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Analyze website
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(analyzeButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Meta Tags')).toBeInTheDocument();
    });

    // Check meta tags
    expect(screen.getByText('description')).toBeInTheDocument();
    expect(screen.getByText('viewport')).toBeInTheDocument();
    expect(screen.getByText('author')).toBeInTheDocument();
  });

  it('disables analyze button during analysis', async () => {
    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Enter URL
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });

    // Button should be enabled initially
    expect(analyzeButton).not.toBeDisabled();

    // Start analysis
    fireEvent.click(analyzeButton);

    // Button should be disabled during analysis
    expect(screen.getByText('Analyzing...')).toBeDisabled();
  });

  it('validates URL format', () => {
    const { toast } = require('sonner');
    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Enter invalid URL
    fireEvent.change(urlInput, { target: { value: 'not-a-valid-url' } });
    fireEvent.click(analyzeButton);

    expect(toast.error).toHaveBeenCalledWith('Please enter a valid URL');
  });

  it('displays response headers', async () => {
    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Analyze website
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(analyzeButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('HTTP Headers')).toBeInTheDocument();
    });

    // Check response headers
    expect(screen.getByText('content-type')).toBeInTheDocument();
    expect(screen.getByText('cache-control')).toBeInTheDocument();
    expect(screen.getByText('server')).toBeInTheDocument();
  });

  it('handles API error responses', async () => {
    const { toast } = require('sonner');
    // Mock API error response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid URL provided' }),
      })
    );

    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Enter URL and analyze
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(analyzeButton);

    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to analyze website');
  });

  it('displays domain and protocol information', async () => {
    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Analyze website
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(analyzeButton);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    // Check domain and protocol info
    expect(screen.getByText('https:')).toBeInTheDocument();
  });

  it('shows loading state correctly', async () => {
    // Mock slow response
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({}),
              }),
            100
          )
        )
    );

    render(<WebStatsPage />);

    const urlInput = screen.getByPlaceholderText('https://example.com');
    const analyzeButton = screen.getByText('Analyze');

    // Start analysis
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(analyzeButton);

    // Should show analyzing state
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    expect(screen.getByText('Analyzing...')).toBeDisabled();
  });
});