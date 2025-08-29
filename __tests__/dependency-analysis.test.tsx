import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DependencyAnalysisPage from '../app/dependency-analysis/page';

// Mock fetch for dependency analysis APIs
const mockFetch = jest.fn();

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(),
};
Object.assign(navigator, {
  clipboard: mockClipboard,
});

describe('DependencyAnalysisPage', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Dependency Analysis page with all components', () => {
    render(<DependencyAnalysisPage />);

    // Check main heading
    expect(screen.getByText('Dependency Analysis')).toBeInTheDocument();

    // Check card titles
    expect(screen.getByText('Package Configuration')).toBeInTheDocument();

    // Check textarea
    expect(screen.getByPlaceholderText('Paste your package.json content here...')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Analyze Dependencies')).toBeInTheDocument();
    expect(screen.getByText('Load Sample')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();

    // Check description
    expect(screen.getByText(/Paste your package.json content to analyze dependencies/)).toBeInTheDocument();
  });

  it('loads sample package.json data', () => {
    const { toast } = require('sonner');
    render(<DependencyAnalysisPage />);

    const loadSampleButton = screen.getByText('Load Sample');
    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');

    // Load sample data
    fireEvent.click(loadSampleButton);

    // Should populate textarea with sample data
    expect(textarea).toHaveValue(expect.stringContaining('"name": "sample-project"'));
    expect(textarea).toHaveValue(expect.stringContaining('"react"'));
    expect(toast.info).toHaveBeenCalledWith('Sample package.json loaded');
  });

  it('clears all fields', () => {
    const { toast } = require('sonner');
    render(<DependencyAnalysisPage />);

    const loadSampleButton = screen.getByText('Load Sample');
    const clearAllButton = screen.getByText('Clear All');
    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');

    // First load sample data
    fireEvent.click(loadSampleButton);
    expect(textarea).toHaveValue(expect.stringContaining('sample-project'));

    // Then clear it
    fireEvent.click(clearAllButton);

    expect(textarea).toHaveValue('');
    expect(toast.info).toHaveBeenCalledWith('Cleared all fields');
  });

  it('analyzes dependencies successfully', async () => {
    const { toast } = require('sonner');
    
    // Mock successful vulnerability check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ vulnerabilities: [] }),
    });

    render(<DependencyAnalysisPage />);

    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');
    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Enter valid package.json
    const packageJson = JSON.stringify({
      name: 'test-project',
      dependencies: {
        react: '^18.2.0',
        lodash: '^4.17.21',
      },
      devDependencies: {
        typescript: '^5.0.0',
      },
    });

    fireEvent.change(textarea, { target: { value: packageJson } });
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Total Packages')).toBeInTheDocument();
    });

    // Check summary cards
    expect(screen.getByText('3')).toBeInTheDocument(); // Total packages
    expect(screen.getByText('Production')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.getByText('Vulnerabilities')).toBeInTheDocument();

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Dependencies analyzed successfully!')
    );
  });

  it('handles empty package.json input', () => {
    render(<DependencyAnalysisPage />);

    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Try to analyze without content
    fireEvent.click(analyzeButton);

    expect(screen.getByText('Please provide package.json content')).toBeInTheDocument();
  });

  it('handles invalid JSON input', () => {
    const { toast } = require('sonner');
    render(<DependencyAnalysisPage />);

    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');
    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Enter invalid JSON
    fireEvent.change(textarea, { target: { value: 'invalid json content' } });
    fireEvent.click(analyzeButton);

    expect(screen.getByText(/Error analyzing dependencies:/)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Failed to analyze dependencies');
  });

  it('handles package.json without dependencies', () => {
    const { toast } = require('sonner');
    render(<DependencyAnalysisPage />);

    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');
    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Enter package.json without dependencies
    const packageJson = JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
    });

    fireEvent.change(textarea, { target: { value: packageJson } });
    fireEvent.click(analyzeButton);

    expect(screen.getByText(/No dependencies found in package.json/)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Failed to analyze dependencies');
  });

  it('displays outdated packages', async () => {
    const { toast } = require('sonner');
    
    // Mock successful vulnerability check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ vulnerabilities: [] }),
    });

    render(<DependencyAnalysisPage />);

    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');
    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Enter package.json with caret dependencies (considered outdated)
    const packageJson = JSON.stringify({
      name: 'test-project',
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        next: '^13.4.0',
      },
    });

    fireEvent.change(textarea, { target: { value: packageJson } });
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Outdated Packages')).toBeInTheDocument();
    });

    // Should show some packages as outdated
    expect(screen.getByText('Update Available')).toBeInTheDocument();
  });

  it('displays vulnerability information', async () => {
    const { toast } = require('sonner');
    
    // Mock vulnerability response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        vulnerabilities: [
          {
            package: 'lodash',
            vulnerabilities: [
              {
                severity: 'high',
                title: 'Prototype Pollution',
                description: 'Lodash is vulnerable to prototype pollution',
                id: 'CVE-2020-8203',
                references: ['https://nvd.nist.gov/vuln/detail/CVE-2020-8203'],
              },
            ],
          },
        ],
      }),
    });

    render(<DependencyAnalysisPage />);

    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');
    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Enter package.json
    const packageJson = JSON.stringify({
      name: 'test-project',
      dependencies: {
        lodash: '^4.17.21',
      },
    });

    fireEvent.change(textarea, { target: { value: packageJson } });
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Security Vulnerabilities')).toBeInTheDocument();
    });

    // Check vulnerability details
    expect(screen.getByText('lodash')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('Prototype Pollution')).toBeInTheDocument();
    expect(screen.getByText('CVE-2020-8203')).toBeInTheDocument();
  });

  it('displays duplicate dependencies', async () => {
    const { toast } = require('sonner');
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ vulnerabilities: [] }),
    });

    render(<DependencyAnalysisPage />);

    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');
    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Enter package.json with duplicate dependencies
    const packageJson = JSON.stringify({
      name: 'test-project',
      dependencies: {
        '@types/node': '^20.0.0',
      },
      devDependencies: {
        '@types/node': '^20.0.0', // Duplicate
      },
    });

    fireEvent.change(textarea, { target: { value: packageJson } });
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Duplicate Dependencies')).toBeInTheDocument();
    });

    // Should show duplicate package
    expect(screen.getByText('@types/node')).toBeInTheDocument();
  });

  it('displays all dependencies list', async () => {
    const { toast } = require('sonner');
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ vulnerabilities: [] }),
    });

    render(<DependencyAnalysisPage />);

    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');
    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Enter package.json
    const packageJson = JSON.stringify({
      name: 'test-project',
      dependencies: {
        react: '^18.2.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
      },
    });

    fireEvent.change(textarea, { target: { value: packageJson } });
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('All Dependencies')).toBeInTheDocument();
    });

    // Check that dependencies are listed
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('prod')).toBeInTheDocument();
    expect(screen.getByText('dev')).toBeInTheDocument();
  });

  it('copies package name to clipboard', async () => {
    const { toast } = require('sonner');
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ vulnerabilities: [] }),
    });

    render(<DependencyAnalysisPage />);

    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');
    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Enter package.json
    const packageJson = JSON.stringify({
      name: 'test-project',
      dependencies: {
        react: '^18.2.0',
      },
    });

    fireEvent.change(textarea, { target: { value: packageJson } });
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('All Dependencies')).toBeInTheDocument();
    });

    // Find and click copy button (📋 emoji)
    const copyButton = screen.getByText('📋');
    fireEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith('react');
    expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
  });

  it('displays dependency tree section', async () => {
    const { toast } = require('sonner');
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ vulnerabilities: [] }),
    });

    render(<DependencyAnalysisPage />);

    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');
    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Enter package.json
    const packageJson = JSON.stringify({
      name: 'test-project',
      dependencies: {
        react: '^18.2.0',
      },
    });

    fireEvent.change(textarea, { target: { value: packageJson } });
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Dependency Tree')).toBeInTheDocument();
    });

    // Should show package selector
    expect(screen.getByText('Select a package to view:')).toBeInTheDocument();
    expect(screen.getByText('Select a package...')).toBeInTheDocument();
  });

  it('handles vulnerability check errors', async () => {
    const { toast } = require('sonner');
    
    // Mock failed vulnerability check
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<DependencyAnalysisPage />);

    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');
    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Enter package.json
    const packageJson = JSON.stringify({
      name: 'test-project',
      dependencies: {
        react: '^18.2.0',
      },
    });

    fireEvent.change(textarea, { target: { value: packageJson } });
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete (should still work without vulnerabilities)
    await waitFor(() => {
      expect(screen.getByText('Total Packages')).toBeInTheDocument();
    });

    // Should show no vulnerabilities when check fails
    expect(screen.getByText('No vulnerabilities detected')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Failed to check vulnerabilities');
  });

  it('shows loading states correctly', async () => {
    // Mock slow vulnerability check
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ vulnerabilities: [] }),
              }),
            100
          )
        )
    );

    render(<DependencyAnalysisPage />);

    const textarea = screen.getByPlaceholderText('Paste your package.json content here...');
    const analyzeButton = screen.getByText('Analyze Dependencies');

    // Enter package.json
    const packageJson = JSON.stringify({
      name: 'test-project',
      dependencies: {
        react: '^18.2.0',
      },
    });

    fireEvent.change(textarea, { target: { value: packageJson } });
    fireEvent.click(analyzeButton);

    // Should show security checking state
    expect(screen.getByText('Checking Security...')).toBeInTheDocument();
  });
});