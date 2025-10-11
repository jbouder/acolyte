import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccessibilityCheckerPage from '../app/accessibility-checker/page';

// Mock fetch
global.fetch = jest.fn();

describe('Accessibility Checker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the accessibility checker page', () => {
    render(<AccessibilityCheckerPage />);

    expect(screen.getByText('Accessibility Checker')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Enter a URL to scan for accessibility issues and WCAG compliance',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('https://example.com'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan/i })).toBeInTheDocument();
  });

  it('shows error when URL is empty and scan is clicked', async () => {
    render(<AccessibilityCheckerPage />);

    const input = screen.getByPlaceholderText('https://example.com');
    const scanButton = screen.getByRole('button', { name: /scan/i });

    // Clear the input
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(scanButton);

    // The component should show an error via toast, but not make a fetch call
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('displays loading state while scanning', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  url: 'https://example.com',
                  timestamp: '2024-01-01T00:00:00.000Z',
                  summary: {
                    totalIssues: 0,
                    errors: 0,
                    warnings: 0,
                    info: 0,
                  },
                  issues: [],
                  checks: {
                    hasLang: true,
                    hasTitle: true,
                    hasMetaViewport: true,
                    hasSkipLink: true,
                    hasAltTexts: true,
                    hasFormLabels: true,
                    hasHeadingStructure: true,
                    hasAriaLabels: true,
                    hasLandmarks: true,
                    hasColorContrast: true,
                  },
                }),
              }),
            100,
          ),
        ),
    );

    render(<AccessibilityCheckerPage />);

    const scanButton = screen.getByRole('button', { name: /scan/i });
    fireEvent.click(scanButton);

    // Check for loading state
    expect(
      screen.getByRole('button', { name: /scanning/i }),
    ).toBeInTheDocument();
  });

  it('displays accessibility report after successful scan', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        url: 'https://example.com',
        timestamp: '2024-01-01T00:00:00.000Z',
        summary: {
          totalIssues: 2,
          errors: 1,
          warnings: 1,
          info: 0,
        },
        issues: [
          {
            type: 'error',
            message: 'HTML element is missing lang attribute',
            element: '<html>',
            wcagLevel: '2.1 Level A',
            wcagCriteria: '3.1.1 Language of Page',
          },
          {
            type: 'warning',
            message: 'Page is missing viewport meta tag for responsive design',
            element: '<head>',
            wcagLevel: '2.1 Level AA',
            wcagCriteria: '1.4.10 Reflow',
          },
        ],
        checks: {
          hasLang: false,
          hasTitle: true,
          hasMetaViewport: false,
          hasSkipLink: true,
          hasAltTexts: true,
          hasFormLabels: true,
          hasHeadingStructure: true,
          hasAriaLabels: true,
          hasLandmarks: true,
          hasColorContrast: true,
        },
      }),
    });

    render(<AccessibilityCheckerPage />);

    const scanButton = screen.getByRole('button', { name: /scan/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText('Total Issues')).toBeInTheDocument();
      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('Warnings')).toBeInTheDocument();
    });

    // Check that issues are displayed
    expect(
      screen.getByText('HTML element is missing lang attribute'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Page is missing viewport meta tag for responsive design',
      ),
    ).toBeInTheDocument();

    // Check that accessibility checks are displayed
    expect(screen.getByText('Accessibility Checks')).toBeInTheDocument();
    expect(screen.getByText('Has Lang')).toBeInTheDocument();
    expect(screen.getByText('Has Title')).toBeInTheDocument();
  });

  it('displays success message when no issues found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        url: 'https://example.com',
        timestamp: '2024-01-01T00:00:00.000Z',
        summary: {
          totalIssues: 0,
          errors: 0,
          warnings: 0,
          info: 0,
        },
        issues: [],
        checks: {
          hasLang: true,
          hasTitle: true,
          hasMetaViewport: true,
          hasSkipLink: true,
          hasAltTexts: true,
          hasFormLabels: true,
          hasHeadingStructure: true,
          hasAriaLabels: true,
          hasLandmarks: true,
          hasColorContrast: true,
        },
      }),
    });

    render(<AccessibilityCheckerPage />);

    const scanButton = screen.getByRole('button', { name: /scan/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText('No Critical Issues Found!')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This page appears to follow accessibility best practices.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('displays error message when scan fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to check accessibility' }),
    });

    render(<AccessibilityCheckerPage />);

    const scanButton = screen.getByRole('button', { name: /scan/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to check accessibility'),
      ).toBeInTheDocument();
    });
  });

  it('allows exporting the report', async () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock document.createElement to track link clicks
    const mockClick = jest.fn();
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = jest.fn((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = mockClick;
      }
      return element;
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        url: 'https://example.com',
        timestamp: '2024-01-01T00:00:00.000Z',
        summary: {
          totalIssues: 0,
          errors: 0,
          warnings: 0,
          info: 0,
        },
        issues: [],
        checks: {
          hasLang: true,
          hasTitle: true,
          hasMetaViewport: true,
          hasSkipLink: true,
          hasAltTexts: true,
          hasFormLabels: true,
          hasHeadingStructure: true,
          hasAriaLabels: true,
          hasLandmarks: true,
          hasColorContrast: true,
        },
      }),
    });

    render(<AccessibilityCheckerPage />);

    const scanButton = screen.getByRole('button', { name: /scan/i });
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(screen.getByText('No Critical Issues Found!')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /export report/i });
    fireEvent.click(exportButton);

    expect(mockClick).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();

    // Restore original createElement
    document.createElement = originalCreateElement;
  });
});
