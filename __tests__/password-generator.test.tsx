import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PasswordGeneratorPage, {
  generatePassword,
} from '../app/password-generator/page';

const mockClipboard = {
  writeText: jest.fn(() => Promise.resolve()),
};
Object.assign(navigator, { clipboard: mockClipboard });

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('generatePassword', () => {
  const baseOptions = {
    length: 16,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
    requireEachType: true,
    count: 1,
  };

  it('generates a password of the requested length', () => {
    const pwd = generatePassword({ ...baseOptions, length: 24 });
    expect(pwd).toHaveLength(24);
  });

  it('only uses the selected character sets', () => {
    const pwd = generatePassword({
      ...baseOptions,
      length: 30,
      uppercase: false,
      numbers: false,
      symbols: false,
    });
    expect(pwd).toMatch(/^[a-z]+$/);
  });

  it('includes at least one of each selected type when requireEachType is on', () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generatePassword(baseOptions);
      expect(pwd).toMatch(/[a-z]/);
      expect(pwd).toMatch(/[A-Z]/);
      expect(pwd).toMatch(/[0-9]/);
      expect(pwd).toMatch(/[!@#$%^&*()\-_=+[\]{};:,.<>?/|~]/);
    }
  });

  it('excludes similar characters when option is enabled', () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generatePassword({
        ...baseOptions,
        length: 60,
        excludeSimilar: true,
      });
      expect(pwd).not.toMatch(/[iIlL1oO0]/);
    }
  });

  it('returns an empty string when no character sets are selected', () => {
    const pwd = generatePassword({
      ...baseOptions,
      lowercase: false,
      uppercase: false,
      numbers: false,
      symbols: false,
    });
    expect(pwd).toBe('');
  });

  it('generates numeric-only passwords for PIN-like options', () => {
    const pwd = generatePassword({
      ...baseOptions,
      length: 6,
      lowercase: false,
      uppercase: false,
      symbols: false,
      requireEachType: false,
    });
    expect(pwd).toMatch(/^[0-9]{6}$/);
  });
});

describe('PasswordGeneratorPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page with default sections', () => {
    render(<PasswordGeneratorPage />);

    expect(screen.getByText('Password Generator')).toBeInTheDocument();
    expect(screen.getByText('Generated Password')).toBeInTheDocument();
    expect(screen.getByText('Options')).toBeInTheDocument();
    expect(screen.getByText('Character Sets')).toBeInTheDocument();
    expect(screen.getByLabelText(/Lowercase/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Uppercase/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Numbers/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Symbols/)).toBeInTheDocument();
  });

  it('generates a password automatically on mount', () => {
    render(<PasswordGeneratorPage />);
    const placeholder = screen.queryByText(
      'Click Generate to create a password...',
    );
    expect(placeholder).not.toBeInTheDocument();
  });

  it('shows an error when all character sets are disabled', async () => {
    render(<PasswordGeneratorPage />);

    fireEvent.click(screen.getByLabelText(/Lowercase/));
    fireEvent.click(screen.getByLabelText(/Uppercase/));
    fireEvent.click(screen.getByLabelText(/Numbers/));
    fireEvent.click(screen.getByLabelText(/Symbols/));

    fireEvent.click(screen.getByRole('button', { name: /^Generate$/ }));

    await waitFor(() => {
      expect(
        screen.getByText('Select at least one character type.'),
      ).toBeInTheDocument();
    });
  });

  it('copies the generated password to the clipboard', async () => {
    const toast = jest.mocked((await import('sonner')).toast);
    render(<PasswordGeneratorPage />);

    fireEvent.click(screen.getByRole('button', { name: /Copy password/i }));

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
    expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!');
  });

  it('generates multiple passwords when count is increased', async () => {
    render(<PasswordGeneratorPage />);

    const countInput = screen.getByLabelText(
      'Number of passwords',
    ) as HTMLInputElement;
    fireEvent.change(countInput, { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /^Generate$/ }));

    await waitFor(() => {
      expect(
        screen.getByText(/Additional passwords \(4\)/),
      ).toBeInTheDocument();
    });
  });
});
