export interface JWTHeader {
  alg: string;
  typ: string;
  kid?: string;
  [key: string]: unknown;
}

export interface JWTPayload {
  iss?: string; // issuer
  sub?: string; // subject
  aud?: string | string[]; // audience
  exp?: number; // expiration time
  nbf?: number; // not before
  iat?: number; // issued at
  jti?: string; // JWT ID
  [key: string]: unknown;
}

export interface DecodedJWT {
  header: JWTHeader;
  payload: JWTPayload;
  signature: string;
  raw: {
    header: string;
    payload: string;
    signature: string;
  };
}

export function base64UrlDecode(str: string): string {
  // Replace URL-safe characters
  str = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  while (str.length % 4) {
    str += '=';
  }

  // Decode base64
  try {
    return atob(str);
  } catch {
    throw new Error('Invalid base64 encoding');
  }
}

export function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeJWT(token: string): DecodedJWT {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token: Token must be a non-empty string');
  }

  // Trim whitespace
  token = token.trim();

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token: JWT must have 3 parts separated by dots');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    // Decode header
    const headerJson = base64UrlDecode(headerB64);
    const header: JWTHeader = JSON.parse(headerJson);

    // Decode payload
    const payloadJson = base64UrlDecode(payloadB64);
    const payload: JWTPayload = JSON.parse(payloadJson);

    return {
      header,
      payload,
      signature: signatureB64,
      raw: {
        header: headerB64,
        payload: payloadB64,
        signature: signatureB64,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      // Provide more specific error context
      if (error.message.includes('base64')) {
        throw new Error(
          `Failed to decode JWT: Invalid base64 encoding in token parts`,
        );
      } else if (error.message.includes('JSON')) {
        throw new Error(
          `Failed to decode JWT: Invalid JSON format in token parts`,
        );
      }
      throw new Error(`Failed to decode JWT: ${error.message}`);
    }
    throw new Error('Failed to decode JWT: Unknown error');
  }
}

export function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return '-';

  try {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  } catch {
    return 'Invalid date';
  }
}

export function isTokenExpired(exp?: number): boolean {
  if (!exp) return false;
  return Date.now() >= exp * 1000;
}

export function generateSampleJWT(): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload = {
    sub: '1234567890',
    name: 'John Doe',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));

  // For demo purposes, we'll use a fake signature
  const signature = base64UrlEncode('fake-signature-for-demo');

  return `${headerB64}.${payloadB64}.${signature}`;
}

// Simple HMAC-SHA256 verification (for educational purposes)
// Note: This is a simplified implementation and shouldn't be used in production
export async function verifySignature(
  token: string,
  secret: string,
  algorithm: string = 'HS256',
): Promise<boolean> {
  if (!crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }

  if (!algorithm.startsWith('HS')) {
    throw new Error(
      'Only HMAC algorithms are supported in this implementation',
    );
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const [header, payload, signature] = parts;
    const data = `${header}.${payload}`;

    // Import the secret key
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    // Sign the data
    const signatureArrayBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(data),
    );
    const expectedSignature = base64UrlEncode(
      String.fromCharCode(...new Uint8Array(signatureArrayBuffer)),
    );

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}
