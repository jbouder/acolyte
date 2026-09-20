// Password generation shared by the Password Generator page, the in-app
// assistant and the MCP Worker. Randomness comes from the Web Crypto RNG,
// which is available in browsers and on Cloudflare Workers alike.

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?/|~';
const SIMILAR = /[iIlL1oO0]/g;
const AMBIGUOUS = /[{}[\]()/\\'"`~,;:.<>]/g;

export type PasswordPreset = 'strong' | 'easy' | 'pin' | 'custom';

export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  requireEachType: boolean;
  count: number;
}

export const PASSWORD_PRESETS: Record<
  Exclude<PasswordPreset, 'custom'>,
  PasswordOptions
> = {
  strong: {
    length: 20,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: true,
    excludeAmbiguous: false,
    requireEachType: true,
    count: 1,
  },
  easy: {
    length: 16,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: false,
    excludeSimilar: true,
    excludeAmbiguous: true,
    requireEachType: true,
    count: 1,
  },
  pin: {
    length: 6,
    lowercase: false,
    uppercase: false,
    numbers: true,
    symbols: false,
    excludeSimilar: false,
    excludeAmbiguous: false,
    requireEachType: false,
    count: 1,
  },
};

export function buildCharset(options: PasswordOptions): {
  charset: string;
  required: string[];
} {
  const sets: string[] = [];
  if (options.lowercase) sets.push(LOWERCASE);
  if (options.uppercase) sets.push(UPPERCASE);
  if (options.numbers) sets.push(NUMBERS);
  if (options.symbols) sets.push(SYMBOLS);

  const filtered = sets.map((s) => {
    let result = s;
    if (options.excludeSimilar) result = result.replace(SIMILAR, '');
    if (options.excludeAmbiguous) result = result.replace(AMBIGUOUS, '');
    return result;
  });

  return {
    charset: filtered.join(''),
    required: filtered.filter((s) => s.length > 0),
  };
}

// Unbiased index in [0, max) using rejection sampling over the crypto RNG.
function randomInt(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

function pickChar(chars: string): string {
  return chars.charAt(randomInt(chars.length));
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generatePassword(options: PasswordOptions): string {
  const { charset, required } = buildCharset(options);
  if (!charset || options.length <= 0) return '';

  const chars: string[] = [];

  if (options.requireEachType) {
    const guaranteed = Math.min(required.length, options.length);
    for (let i = 0; i < guaranteed; i++) {
      chars.push(pickChar(required[i]));
    }
  }

  while (chars.length < options.length) {
    chars.push(pickChar(charset));
  }

  return shuffleArray(chars).join('');
}

export interface PasswordStrength {
  bits: number;
  label: string;
  color: string;
  percent: number;
}

export function calculateStrength(
  password: string,
  charsetSize: number,
): PasswordStrength {
  if (!password || charsetSize <= 1) {
    return { bits: 0, label: 'None', color: 'bg-muted-foreground', percent: 0 };
  }
  const bits = password.length * Math.log2(charsetSize);
  let label = 'Weak';
  let color = 'bg-tone-red';
  if (bits >= 128) {
    label = 'Very Strong';
    color = 'bg-tone-green';
  } else if (bits >= 80) {
    label = 'Strong';
    color = 'bg-tone-green';
  } else if (bits >= 60) {
    label = 'Good';
    color = 'bg-tone-amber';
  } else if (bits >= 40) {
    label = 'Fair';
    color = 'bg-tone-amber';
  }
  const percent = Math.min(100, (bits / 128) * 100);
  return { bits: Math.round(bits), label, color, percent };
}
