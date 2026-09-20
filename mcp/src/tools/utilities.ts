import { z } from 'zod';
import { decodeBase64, encodeBase64 } from '@/lib/base64-utils';
import { formatColor } from '@/lib/color-utils';
import { decodeJWT, isTokenExpired, verifySignature } from '@/lib/jwt-utils';
import {
  buildCharset,
  calculateStrength,
  generatePassword,
  PASSWORD_PRESETS,
} from '@/lib/password-utils';
import { findMatches } from '@/lib/regex-utils';
import { defineTool } from './types';

const readOnly = { readOnlyHint: true, idempotentHint: true };

const jsonInput = z.object({
  json: z.string().describe('The JSON text to process.'),
});

export const formatJson = defineTool({
  name: 'format_json',
  title: 'Format JSON',
  description:
    'Pretty-print JSON text. Mirrors the JSON Formatter tool; returns an error when the input is not valid JSON.',
  inputSchema: z.object({
    json: z.string().describe('The JSON text to format.'),
    indent: z
      .number()
      .int()
      .min(0)
      .max(8)
      .default(2)
      .describe('Spaces per indentation level (default 2).'),
  }),
  annotations: readOnly,
  handler: ({ json, indent }) => JSON.stringify(JSON.parse(json), null, indent),
});

export const validateJson = defineTool({
  name: 'validate_json',
  title: 'Validate JSON',
  description:
    'Check whether text is valid JSON. Returns the parse error message when it is not, rather than failing.',
  inputSchema: jsonInput,
  annotations: readOnly,
  handler: ({ json }) => {
    try {
      const value = JSON.parse(json);
      const kind = Array.isArray(value) ? 'array' : typeof value;
      return { json: { valid: true, type: kind } };
    } catch (error) {
      return {
        json: {
          valid: false,
          error: error instanceof Error ? error.message : 'Invalid JSON',
        },
      };
    }
  },
});

export const minifyJson = defineTool({
  name: 'minify_json',
  title: 'Minify JSON',
  description: 'Minify JSON text into a single compact line.',
  inputSchema: jsonInput,
  annotations: readOnly,
  handler: ({ json }) => JSON.stringify(JSON.parse(json)),
});

export const base64Encode = defineTool({
  name: 'encode_base64',
  title: 'Encode Base64',
  description: 'Encode UTF-8 text as Base64.',
  inputSchema: z.object({
    text: z.string().describe('Plain text to encode.'),
  }),
  annotations: readOnly,
  handler: ({ text }) => encodeBase64(text),
});

export const base64Decode = defineTool({
  name: 'decode_base64',
  title: 'Decode Base64',
  description: 'Decode Base64 text back into UTF-8 text.',
  inputSchema: z.object({
    base64: z.string().describe('Base64 text to decode.'),
  }),
  annotations: readOnly,
  handler: ({ base64 }) => decodeBase64(base64),
});

export const jwtDecode = defineTool({
  name: 'decode_jwt',
  title: 'Decode JWT',
  description:
    'Decode a JSON Web Token and return its header, payload, expiry status and readable timestamps. Optionally verify an HS256 signature with a shared secret.',
  inputSchema: z.object({
    token: z.string().describe('The JWT (header.payload.signature).'),
    secret: z
      .string()
      .optional()
      .describe('Optional HMAC secret to verify an HS256 signature.'),
  }),
  annotations: readOnly,
  handler: async ({ token, secret }) => {
    const decoded = decodeJWT(token);
    const { exp, iat, nbf } = decoded.payload;
    const toIso = (seconds?: number) =>
      typeof seconds === 'number'
        ? new Date(seconds * 1000).toISOString()
        : null;

    return {
      json: {
        header: decoded.header,
        payload: decoded.payload,
        signature: decoded.signature,
        expired: isTokenExpired(exp),
        timestamps: {
          issuedAt: toIso(iat),
          notBefore: toIso(nbf),
          expiresAt: toIso(exp),
        },
        signatureValid:
          secret === undefined
            ? undefined
            : await verifySignature(
                token.trim(),
                secret,
                String(decoded.header.alg ?? 'HS256'),
              ),
      },
    };
  },
});

export const colorConvert = defineTool({
  name: 'convert_color',
  title: 'Convert color',
  description:
    'Convert a color between HEX, RGB and HSL. Accepts "#3b82f6", "rgb(59, 130, 246)" or "hsl(217, 91%, 60%)" style input.',
  inputSchema: z.object({
    color: z.string().describe('A color in HEX, RGB or HSL notation.'),
  }),
  annotations: readOnly,
  handler: ({ color }) => formatColor(color),
});

export const regexTest = defineTool({
  name: 'test_regex',
  title: 'Test regex',
  description:
    'Run a JavaScript regular expression against sample text and list every match with its index and capture groups.',
  inputSchema: z.object({
    pattern: z
      .string()
      .describe('The regular expression source, without slashes.'),
    text: z.string().describe('The text to search.'),
    flags: z
      .string()
      .default('g')
      .describe('RegExp flags, e.g. "gi". Defaults to "g".'),
  }),
  annotations: readOnly,
  handler: ({ pattern, text, flags }) => {
    const matches = findMatches(pattern, flags, text);
    return { json: { count: matches.length, matches } };
  },
});

export const passwordGenerate = defineTool({
  name: 'generate_password',
  title: 'Generate password',
  description:
    'Generate cryptographically random passwords. Uses the same presets and options as the Password Generator tool.',
  inputSchema: z.object({
    preset: z
      .enum(['strong', 'easy', 'pin'])
      .default('strong')
      .describe(
        'strong: 20 chars, all classes; easy: 16 chars, no symbols or ambiguous glyphs; pin: 6 digits.',
      ),
    length: z.number().int().min(4).max(128).optional(),
    count: z.number().int().min(1).max(20).default(1),
    lowercase: z.boolean().optional(),
    uppercase: z.boolean().optional(),
    numbers: z.boolean().optional(),
    symbols: z.boolean().optional(),
    excludeSimilar: z
      .boolean()
      .optional()
      .describe('Drop look-alike characters such as i, l, 1, O and 0.'),
    excludeAmbiguous: z
      .boolean()
      .optional()
      .describe('Drop punctuation that is hard to read or type.'),
    requireEachType: z.boolean().optional(),
  }),
  annotations: { readOnlyHint: true, idempotentHint: false },
  handler: ({ preset, count, ...overrides }) => {
    const options = { ...PASSWORD_PRESETS[preset] };
    for (const [key, value] of Object.entries(overrides)) {
      if (value !== undefined) {
        (options as unknown as Record<string, unknown>)[key] = value;
      }
    }
    options.count = count;

    const { charset } = buildCharset(options);
    if (!charset) {
      throw new Error('Enable at least one character class.');
    }

    const passwords = Array.from({ length: count }, () =>
      generatePassword(options),
    );
    const strength = calculateStrength(passwords[0], charset.length);

    return {
      json: {
        passwords,
        length: options.length,
        entropyBits: strength.bits,
        strength: strength.label,
      },
    };
  },
});

export const utilityTools = [
  formatJson,
  validateJson,
  minifyJson,
  base64Encode,
  base64Decode,
  jwtDecode,
  colorConvert,
  regexTest,
  passwordGenerate,
];
