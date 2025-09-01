import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import GamesPage from '@/app/games/page';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('GamesPage Password Protection', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should show password modal when no password is stored', async () => {
    render(<GamesPage />);
    
    // Should show password modal
    expect(screen.getByText("What's the password?")).toBeInTheDocument();
    expect(screen.getByText('Enter the password to access games')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    
    // Games should not be visible yet
    expect(screen.queryByText('Snake')).not.toBeInTheDocument();
  });

  it('should accept correct password (case insensitive)', async () => {
    render(<GamesPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    // Try correct password with different case
    fireEvent.change(passwordInput, { target: { value: 'NEW ENGLAND CLAM CHOWDER' } });
    fireEvent.click(submitButton);
    
    // Modal should disappear and games should be visible
    await waitFor(() => {
      expect(screen.queryByText("What's the password?")).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Snake')).toBeInTheDocument();
    expect(screen.getByText('Breakout')).toBeInTheDocument();
    expect(screen.getByText('Sudoku')).toBeInTheDocument();
  });

  it('should reject incorrect password', async () => {
    render(<GamesPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    // Try incorrect password
    fireEvent.change(passwordInput, { target: { value: 'wrong password' } });
    fireEvent.click(submitButton);
    
    // Modal should still be visible
    await waitFor(() => {
      expect(screen.getByText('Incorrect password. Please try again.')).toBeInTheDocument();
    });
    
    expect(screen.getByText("What's the password?")).toBeInTheDocument();
    expect(screen.queryByText('Snake')).not.toBeInTheDocument();
  });

  it('should remember password in localStorage', async () => {
    render(<GamesPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    // Enter correct password
    fireEvent.change(passwordInput, { target: { value: 'new england clam chowder' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByText("What's the password?")).not.toBeInTheDocument();
    });
    
    // Check localStorage was set
    expect(localStorageMock.getItem('games-password-verified')).toBe('true');
  });

  it('should not show modal when password is already stored', () => {
    // Pre-set password in localStorage
    localStorageMock.setItem('games-password-verified', 'true');
    
    render(<GamesPage />);
    
    // Modal should not be visible
    expect(screen.queryByText("What's the password?")).not.toBeInTheDocument();
    
    // Games should be visible immediately
    expect(screen.getByText('Snake')).toBeInTheDocument();
    expect(screen.getByText('Breakout')).toBeInTheDocument();
    expect(screen.getByText('Sudoku')).toBeInTheDocument();
  });

  it('should allow Enter key to submit password', async () => {
    render(<GamesPage />);
    
    const passwordInput = screen.getByLabelText('Password');
    
    // Enter correct password and press Enter
    fireEvent.change(passwordInput, { target: { value: 'new england clam chowder' } });
    fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });
    
    // Modal should disappear and games should be visible
    await waitFor(() => {
      expect(screen.queryByText("What's the password?")).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Snake')).toBeInTheDocument();
  });
});