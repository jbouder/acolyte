import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import JWTPage from '../app/jwt/page';

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

// Mock the jwt-utils module
jest.mock('@/lib/jwt-utils', () => ({
  decodeJWT: jest.fn(),
  formatTimestamp: jest.fn(),
  generateSampleJWT: jest.fn(),
  isTokenExpired: jest.fn(),
  verifySignature: jest.fn(),
}));

// Mock crypto.subtle for signature verification
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    sign: jest.fn(),
  },
};
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

describe('JWTPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the JWT page with all components', () => {
    render(<JWTPage />);

    // Check main heading
    expect(screen.getByText('JWT Decoder')).toBeInTheDocument();

    // Check card titles
    expect(screen.getByText('JWT Token Input')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Payload')).toBeInTheDocument();
    expect(screen.getByText('Signature Verification')).toBeInTheDocument();
    expect(screen.getByText('Token Information')).toBeInTheDocument();

    // Check input fields
    expect(screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter secret key for verification...')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Decode JWT')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Generate Sample JWT')).toBeInTheDocument();
    expect(screen.getByText('Verify Signature')).toBeInTheDocument();
    expect(screen.getByText('Copy Header')).toBeInTheDocument();
    expect(screen.getByText('Copy Payload')).toBeInTheDocument();

    // Check algorithm selector
    expect(screen.getByText('HS256')).toBeInTheDocument();
  });

  it('decodes a valid JWT token', async () => {
    const { toast } = require('sonner');
    const { decodeJWT } = require('@/lib/jwt-utils');
    
    const mockDecodedJWT = {
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'John Doe', iat: 1516239022 },
      signature: 'signature',
      raw: { header: 'header', payload: 'payload', signature: 'signature' }
    };

    decodeJWT.mockReturnValue(mockDecodedJWT);

    render(<JWTPage />);

    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);
    const decodeButton = screen.getByText('Decode JWT');

    // Enter a token
    fireEvent.change(tokenInput, {
      target: { value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' }
    });

    // Click decode button
    fireEvent.click(decodeButton);

    expect(decodeJWT).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('JWT decoded successfully!');

    // Check that header and payload are displayed
    await waitFor(() => {
      expect(screen.getByText('"alg":')).toBeInTheDocument();
      expect(screen.getByText('"name":')).toBeInTheDocument();
    });
  });

  it('handles decode errors gracefully', () => {
    const { toast } = require('sonner');
    const { decodeJWT } = require('@/lib/jwt-utils');
    
    decodeJWT.mockImplementation(() => {
      throw new Error('Invalid JWT format');
    });

    render(<JWTPage />);

    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);
    const decodeButton = screen.getByText('Decode JWT');

    // Enter invalid token
    fireEvent.change(tokenInput, { target: { value: 'invalid.token' } });
    fireEvent.click(decodeButton);

    expect(decodeJWT).toHaveBeenCalled();
    expect(screen.getByText('Invalid JWT format')).toBeInTheDocument();
  });

  it('handles empty token input', () => {
    render(<JWTPage />);

    const decodeButton = screen.getByText('Decode JWT');

    // Click decode without entering token
    fireEvent.click(decodeButton);

    expect(screen.getByText('Please enter a JWT token')).toBeInTheDocument();
  });

  it('generates sample JWT', () => {
    const { toast } = require('sonner');
    const { generateSampleJWT, decodeJWT } = require('@/lib/jwt-utils');
    
    const sampleToken = 'sample.jwt.token';
    const mockDecodedJWT = {
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'Sample User', iat: 1516239022 },
      signature: 'signature',
      raw: { header: 'header', payload: 'payload', signature: 'signature' }
    };

    generateSampleJWT.mockReturnValue(sampleToken);
    decodeJWT.mockReturnValue(mockDecodedJWT);

    render(<JWTPage />);

    const generateButton = screen.getByText('Generate Sample JWT');
    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);

    fireEvent.click(generateButton);

    expect(generateSampleJWT).toHaveBeenCalled();
    expect(decodeJWT).toHaveBeenCalledWith(sampleToken);
    expect(tokenInput).toHaveValue(sampleToken);
    expect(toast.success).toHaveBeenCalledWith('Sample JWT generated and decoded!');
  });

  it('clears all fields when clear button is clicked', () => {
    const { decodeJWT } = require('@/lib/jwt-utils');
    
    const mockDecodedJWT = {
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'John Doe', iat: 1516239022 },
      signature: 'signature',
      raw: { header: 'header', payload: 'payload', signature: 'signature' }
    };

    decodeJWT.mockReturnValue(mockDecodedJWT);

    render(<JWTPage />);

    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);
    const secretInput = screen.getByPlaceholderText('Enter secret key for verification...');
    const decodeButton = screen.getByText('Decode JWT');
    const clearButton = screen.getByText('Clear');

    // Enter some data
    fireEvent.change(tokenInput, { target: { value: 'some.jwt.token' } });
    fireEvent.change(secretInput, { target: { value: 'secret' } });
    fireEvent.click(decodeButton);

    // Clear all
    fireEvent.click(clearButton);

    expect(tokenInput).toHaveValue('');
    expect(secretInput).toHaveValue('');
  });

  it('copies header to clipboard', async () => {
    const { toast } = require('sonner');
    const { decodeJWT } = require('@/lib/jwt-utils');
    
    const mockDecodedJWT = {
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'John Doe', iat: 1516239022 },
      signature: 'signature',
      raw: { header: 'header', payload: 'payload', signature: 'signature' }
    };

    decodeJWT.mockReturnValue(mockDecodedJWT);

    render(<JWTPage />);

    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);
    const decodeButton = screen.getByText('Decode JWT');
    const copyHeaderButton = screen.getByText('Copy Header');

    // First decode a token
    fireEvent.change(tokenInput, { target: { value: 'some.jwt.token' } });
    fireEvent.click(decodeButton);

    // Then copy header
    fireEvent.click(copyHeaderButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(mockDecodedJWT.header, null, 2)
      );
      expect(toast.success).toHaveBeenCalledWith('Header copied to clipboard!');
    });
  });

  it('copies payload to clipboard', async () => {
    const { toast } = require('sonner');
    const { decodeJWT } = require('@/lib/jwt-utils');
    
    const mockDecodedJWT = {
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { sub: '1234567890', name: 'John Doe', iat: 1516239022 },
      signature: 'signature',
      raw: { header: 'header', payload: 'payload', signature: 'signature' }
    };

    decodeJWT.mockReturnValue(mockDecodedJWT);

    render(<JWTPage />);

    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);
    const decodeButton = screen.getByText('Decode JWT');
    const copyPayloadButton = screen.getByText('Copy Payload');

    // First decode a token
    fireEvent.change(tokenInput, { target: { value: 'some.jwt.token' } });
    fireEvent.click(decodeButton);

    // Then copy payload
    fireEvent.click(copyPayloadButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(mockDecodedJWT.payload, null, 2)
      );
      expect(toast.success).toHaveBeenCalledWith('Payload copied to clipboard!');
    });
  });

  it('verifies signature successfully', async () => {
    const { toast } = require('sonner');
    const { verifySignature } = require('@/lib/jwt-utils');
    
    verifySignature.mockResolvedValue(true);

    render(<JWTPage />);

    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);
    const secretInput = screen.getByPlaceholderText('Enter secret key for verification...');
    const verifyButton = screen.getByText('Verify Signature');

    // Enter token and secret
    fireEvent.change(tokenInput, { target: { value: 'some.jwt.token' } });
    fireEvent.change(secretInput, { target: { value: 'secret' } });

    // Click verify
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(verifySignature).toHaveBeenCalledWith('some.jwt.token', 'secret', 'HS256');
      expect(toast.success).toHaveBeenCalledWith('Signature is valid!');
      expect(screen.getByText('Signature is valid')).toBeInTheDocument();
    });
  });

  it('handles signature verification failure', async () => {
    const { toast } = require('sonner');
    const { verifySignature } = require('@/lib/jwt-utils');
    
    verifySignature.mockResolvedValue(false);

    render(<JWTPage />);

    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);
    const secretInput = screen.getByPlaceholderText('Enter secret key for verification...');
    const verifyButton = screen.getByText('Verify Signature');

    // Enter token and secret
    fireEvent.change(tokenInput, { target: { value: 'some.jwt.token' } });
    fireEvent.change(secretInput, { target: { value: 'wrong-secret' } });

    // Click verify
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(verifySignature).toHaveBeenCalledWith('some.jwt.token', 'wrong-secret', 'HS256');
      expect(toast.success).toHaveBeenCalledWith('Signature is invalid!');
      expect(screen.getByText('Signature is invalid')).toBeInTheDocument();
    });
  });

  it('handles signature verification error', async () => {
    const { toast } = require('sonner');
    const { verifySignature } = require('@/lib/jwt-utils');
    
    verifySignature.mockRejectedValue(new Error('Verification failed'));

    render(<JWTPage />);

    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);
    const secretInput = screen.getByPlaceholderText('Enter secret key for verification...');
    const verifyButton = screen.getByText('Verify Signature');

    // Enter token and secret
    fireEvent.change(tokenInput, { target: { value: 'some.jwt.token' } });
    fireEvent.change(secretInput, { target: { value: 'secret' } });

    // Click verify
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Verification failed');
      expect(screen.getByText('Signature is invalid')).toBeInTheDocument();
    });
  });

  it('requires both token and secret for verification', () => {
    const { toast } = require('sonner');
    render(<JWTPage />);

    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);
    const secretInput = screen.getByPlaceholderText('Enter secret key for verification...');
    const verifyButton = screen.getByText('Verify Signature');

    // Try to verify without token - button should be disabled
    expect(verifyButton).toBeDisabled();

    // Enter token but no secret - button should still be disabled
    fireEvent.change(tokenInput, { target: { value: 'some.jwt.token' } });
    expect(verifyButton).toBeDisabled();

    // Button should be enabled with both token and secret
    fireEvent.change(secretInput, { target: { value: 'secret' } });
    expect(verifyButton).not.toBeDisabled();
  });

  it('displays token information when JWT is decoded', () => {
    const { decodeJWT, formatTimestamp, isTokenExpired } = require('@/lib/jwt-utils');
    
    const mockDecodedJWT = {
      header: { alg: 'HS256', typ: 'JWT' },
      payload: { 
        sub: '1234567890', 
        name: 'John Doe', 
        iat: 1516239022,
        exp: 1516242622,
        iss: 'test-issuer'
      },
      signature: 'signature',
      raw: { header: 'header', payload: 'payload', signature: 'signature' }
    };

    decodeJWT.mockReturnValue(mockDecodedJWT);
    formatTimestamp.mockImplementation((timestamp) => timestamp ? new Date(timestamp * 1000).toLocaleString() : '-');
    isTokenExpired.mockReturnValue(false);

    render(<JWTPage />);

    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);
    const decodeButton = screen.getByText('Decode JWT');

    // Decode a token
    fireEvent.change(tokenInput, { target: { value: 'some.jwt.token' } });
    fireEvent.click(decodeButton);

    // Check token information is displayed
    expect(screen.getByText('Token Type:')).toBeInTheDocument();
    expect(screen.getByText('Algorithm:')).toBeInTheDocument();
    expect(screen.getByText('Issued At:')).toBeInTheDocument();
    expect(screen.getByText('Expires At:')).toBeInTheDocument();
    expect(screen.getByText('Subject:')).toBeInTheDocument();
    expect(screen.getByText('Issuer:')).toBeInTheDocument();
    expect(screen.getByText('Token Status: Valid')).toBeInTheDocument();
  });

  it('changes algorithm selection', () => {
    render(<JWTPage />);

    // Find and click the algorithm selector
    const algorithmSelect = screen.getByRole('combobox');
    fireEvent.click(algorithmSelect);

    // Check that algorithm options are available
    expect(screen.getByText('HS384')).toBeInTheDocument();
    expect(screen.getByText('HS512')).toBeInTheDocument();
  });

  it('disables copy buttons when no JWT is decoded', () => {
    render(<JWTPage />);

    const copyHeaderButton = screen.getByText('Copy Header');
    const copyPayloadButton = screen.getByText('Copy Payload');

    expect(copyHeaderButton).toBeDisabled();
    expect(copyPayloadButton).toBeDisabled();
  });

  it('disables verify button when fields are empty', () => {
    render(<JWTPage />);

    const verifyButton = screen.getByText('Verify Signature');

    // Button should be disabled initially
    expect(verifyButton).toBeDisabled();

    // Should remain disabled with only token
    const tokenInput = screen.getByPlaceholderText(/eyJhbGciOiJIUzI1NiIs/);
    fireEvent.change(tokenInput, { target: { value: 'some.jwt.token' } });
    expect(verifyButton).toBeDisabled();

    // Should be enabled with both token and secret
    const secretInput = screen.getByPlaceholderText('Enter secret key for verification...');
    fireEvent.change(secretInput, { target: { value: 'secret' } });
    expect(verifyButton).not.toBeDisabled();
  });
});