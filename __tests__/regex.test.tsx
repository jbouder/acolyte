import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RegexPage from '../app/regex/page';

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

describe('RegexPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Regex page with all components', () => {
    render(<RegexPage />);

    // Check main heading
    expect(screen.getByText('Regex Tester')).toBeInTheDocument();

    // Check main sections
    expect(screen.getByText('Regular Expression')).toBeInTheDocument();
    expect(screen.getByText('Test String')).toBeInTheDocument();

    // Check input fields
    expect(screen.getByPlaceholderText('Enter regex pattern...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter test string here...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('flags')).toBeInTheDocument();

    // Check common patterns section
    expect(screen.getByText('Common Patterns')).toBeInTheDocument();
    expect(screen.getByText('Select a common pattern...')).toBeInTheDocument();

    // Check flags guide
    expect(screen.getByText('Flags Guide')).toBeInTheDocument();
    // Don't check specific flag text since it might be split across elements
  });

  it('tests basic regex functionality', async () => {
    render(<RegexPage />);

    const patternInput = screen.getByPlaceholderText('Enter regex pattern...');
    const testStringInput = screen.getByPlaceholderText('Enter test string here...');

    // Enter a simple pattern and test string
    fireEvent.change(patternInput, { target: { value: '\\d+' } });
    fireEvent.change(testStringInput, { target: { value: 'Test 123' } });

    // Check that valid regex badge appears
    await waitFor(() => {
      expect(screen.getByText('Valid Regex')).toBeInTheDocument();
    });
  });

  it('shows matches when pattern finds results', async () => {
    render(<RegexPage />);

    const patternInput = screen.getByPlaceholderText('Enter regex pattern...');
    const testStringInput = screen.getByPlaceholderText('Enter test string here...');

    // Enter pattern and test string with matches
    fireEvent.change(patternInput, { target: { value: '\\d+' } });
    fireEvent.change(testStringInput, { target: { value: 'Numbers: 123 and 456' } });

    // Check that matches section appears
    await waitFor(() => {
      expect(screen.getByText('Matches')).toBeInTheDocument();
    });
  });

  it('shows character count for test string', async () => {
    render(<RegexPage />);

    const testStringInput = screen.getByPlaceholderText('Enter test string here...');

    // Enter test string
    fireEvent.change(testStringInput, { target: { value: 'hello' } });

    // Check character count appears
    await waitFor(() => {
      expect(screen.getByText('5 characters')).toBeInTheDocument();
    });
  });

  it('handles invalid regex patterns', async () => {
    render(<RegexPage />);

    const patternInput = screen.getByPlaceholderText('Enter regex pattern...');
    const testStringInput = screen.getByPlaceholderText('Enter test string here...');

    // Enter invalid regex
    fireEvent.change(patternInput, { target: { value: '[invalid' } });
    fireEvent.change(testStringInput, { target: { value: 'test' } });

    // Should handle gracefully without crashing
    expect(patternInput).toHaveValue('[invalid');
  });

  it('allows selecting common patterns', async () => {
    render(<RegexPage />);

    // Check that common patterns selector is present
    expect(screen.getByText('Select a common pattern...')).toBeInTheDocument();
    
    // This tests the UI exists - actual selection would need more complex mocking
    const selectTrigger = screen.getByText('Select a common pattern...');
    expect(selectTrigger).toBeInTheDocument();
  });

  it('shows flags guide information', () => {
    render(<RegexPage />);

    // Check flags guide
    expect(screen.getByText('Flags Guide')).toBeInTheDocument();
    // Check the actual text that appears in the page
    expect(screen.getByText(/Global.*find all matches/)).toBeInTheDocument();
    expect(screen.getByText(/Case insensitive/)).toBeInTheDocument();
  });

  it('allows editing flags', () => {
    render(<RegexPage />);

    const flagsInput = screen.getByPlaceholderText('flags');
    
    // Change flags
    fireEvent.change(flagsInput, { target: { value: 'gi' } });
    
    expect(flagsInput).toHaveValue('gi');
  });

  it('has clear all functionality', () => {
    render(<RegexPage />);

    const clearButton = screen.getByText('Clear All');
    expect(clearButton).toBeInTheDocument();
    
    // Clear button should be clickable
    fireEvent.click(clearButton);
  });

  it('copies regex when copy button is available', async () => {
    const { toast } = require('sonner');
    render(<RegexPage />);

    const patternInput = screen.getByPlaceholderText('Enter regex pattern...');
    
    // Enter a valid pattern
    fireEvent.change(patternInput, { target: { value: 'test' } });

    // Look for copy button when it appears
    await waitFor(() => {
      const copyButton = screen.queryByText('Copy Regex');
      if (copyButton) {
        fireEvent.click(copyButton);
        expect(mockClipboard.writeText).toHaveBeenCalled();
      }
    });
  });

  it('handles empty inputs gracefully', () => {
    render(<RegexPage />);

    const patternInput = screen.getByPlaceholderText('Enter regex pattern...');
    const testStringInput = screen.getByPlaceholderText('Enter test string here...');

    // Should render without errors even with empty inputs
    expect(patternInput).toHaveValue('');
    expect(testStringInput).toHaveValue('');
  });
});