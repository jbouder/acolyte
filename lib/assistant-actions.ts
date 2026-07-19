import { assistantTools } from '@/lib/assistant-tools';
import { formatColor } from '@/lib/color-utils';
import { decodeJWT } from '@/lib/jwt-utils';
import { findMatches } from '@/lib/regex-utils';
import { allTools, searchableTools, type Tool } from '@/lib/tools-data';

export const assistantActionNames = [
  'list_tools',
  'list_app_tools',
  'find_tools',
  'open_tool',
  'toggle_theme',
  'format_json',
  'validate_json',
  'minify_json',
  'encode_base64',
  'decode_base64',
  'generate_password',
  'decode_jwt',
  'convert_color',
  'test_regex',
] as const;

export type AssistantActionName = (typeof assistantActionNames)[number];

export interface AssistantAction {
  name: AssistantActionName;
  input: string;
}

const actionNames = new Set<AssistantActionName>(assistantActionNames);

export function isAssistantAction(value: unknown): value is AssistantAction {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'input' in value &&
    typeof value.name === 'string' &&
    actionNames.has(value.name as AssistantActionName) &&
    typeof value.input === 'string'
  );
}

// Resolve free-text like "the regex tester" to a known Acolyte tool so the
// chat can navigate to it. Prefers an exact title, then a title contained in
// (or containing) the query, then a keyword/description match.
export function resolveAppTool(query: string): Tool | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return (
    allTools.find((tool) => tool.title.toLowerCase() === q) ??
    allTools.find((tool) => {
      const title = tool.title.toLowerCase();
      return q.includes(title) || title.includes(q);
    }) ??
    allTools.find((tool) =>
      [tool.title, tool.description, ...tool.keywords]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  );
}

// Pull the first JWT-shaped token out of the message. A JWT is three
// base64url segments separated by dots, and its header always begins with
// "eyJ" (Base64 for `{"`), which makes it distinctive enough to detect on
// sight — the signature segment may be empty for unsecured tokens.
function extractJwt(message: string): string | undefined {
  return message.match(
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/,
  )?.[0];
}

// Isolate the Base64 payload from a message like "decode this base64: SGVsbG8=".
// Ordinary words also match the Base64 alphabet, so a candidate only counts
// when it carries padding, a non-letter Base64 character, or real length —
// and known command words are ignored outright.
function extractBase64Payload(message: string): string | undefined {
  const candidates = (message.match(/[A-Za-z0-9+/=_-]{4,}/g) ?? []).filter(
    (token) =>
      !/^(base64|base-64|b64|decode|decoded|please|this|that)$/i.test(token) &&
      (/=$/.test(token) || /[0-9+/_-]/.test(token) || token.length >= 16),
  );
  if (candidates.length === 0) return undefined;
  return candidates.sort((a, b) => b.length - a.length)[0];
}

// Fast, deterministic intent detection that runs before the local model. It
// only fires on high-confidence, high-value phrasings where routing must be
// reliable; anything it doesn't recognize returns undefined and falls through
// to the model for open-ended handling.
export function detectAssistantAction(
  message: string,
): AssistantAction | undefined {
  const text = message.toLowerCase();

  // A JWT is self-identifying, so decode it whenever one appears.
  const jwt = extractJwt(message);
  if (jwt) return { name: 'decode_jwt', input: jwt };

  // Base64 decode needs an explicit ask plus a payload we can isolate.
  if (/\bbase\s?-?64\b|\bb64\b/.test(text) && /\bdecod/.test(text)) {
    const payload = extractBase64Payload(message);
    if (payload) return { name: 'decode_base64', input: payload };
  }

  // Password generation: an explicit ask, with an optional length.
  if (
    /\bpasswords?\b|\bpassphrases?\b/.test(text) &&
    /\b(generate|create|make|new|random|give|need|want|strong|secure)\b/.test(
      text,
    )
  ) {
    return {
      name: 'generate_password',
      input: message.match(/\d+/)?.[0] ?? '',
    };
  }

  // Color conversion: an explicit rgb()/hsl() literal, or a hex value that is
  // clearly about color — either accompanied by a color word or standing on
  // its own — so incidental "#abc123"-style tokens (commit/issue refs) don't
  // trigger it.
  const hasRgbHsl = /\b(rgb|hsl)a?\(/i.test(text);
  const hasHex = /#[0-9a-f]{3}(?:[0-9a-f]{3})?\b/i.test(message);
  const hasColorWord = /\b(colou?r|hex|rgb|hsl|hue|shade|tint)\b/.test(text);
  const isOnlyHex = /^#?[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(message.trim());
  if (hasRgbHsl || (hasHex && (hasColorWord || isOnlyHex))) {
    return { name: 'convert_color', input: message };
  }

  // JSON minify: an explicit ask plus something object/array-shaped.
  if (/\bminif/.test(text)) {
    const json = extractJson(message);
    if (json) return { name: 'minify_json', input: json };
  }

  // Navigation: "open/go to/show me <tool>" that resolves to a real tool.
  if (/\b(open|go to|navigate to|take me to|show me)\b/.test(text)) {
    if (resolveAppTool(message)) return { name: 'open_tool', input: message };
  }

  return undefined;
}

// Slice out the first balanced JSON object or array from a message so a
// "minify this: { … }" request can be processed without the surrounding prose.
function extractJson(message: string): string | undefined {
  const start = message.search(/[{[]/);
  if (start === -1) return undefined;
  const open = message[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < message.length; i++) {
    const char = message[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === open) depth++;
    else if (char === close) {
      depth--;
      if (depth === 0) return message.slice(start, i + 1);
    }
  }
  return undefined;
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const PASSWORD_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';

// Unbiased index in [0, max) using rejection sampling over the browser's
// cryptographic RNG, mirroring the standalone Password Generator tool.
function randomInt(max: number) {
  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

function generatePassword(input: string) {
  const requested = Number.parseInt(input.trim(), 10);
  const length = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 8), 128)
    : 20;

  let password = '';
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARSET.charAt(randomInt(PASSWORD_CHARSET.length));
  }
  return password;
}

function decodeJwt(input: string) {
  const decoded = decodeJWT(input.trim());
  return `Header:\n${JSON.stringify(
    decoded.header,
    null,
    2,
  )}\n\nPayload:\n${JSON.stringify(decoded.payload, null, 2)}`;
}

// Runs a regex against text. Input is JSON: {"pattern","flags"?,"text"}.
function testRegex(input: string) {
  const {
    pattern,
    flags = 'g',
    text,
  } = JSON.parse(input) as {
    pattern?: string;
    flags?: string;
    text?: string;
  };
  if (typeof pattern !== 'string' || typeof text !== 'string') {
    throw new Error('Provide JSON with a "pattern" and "text" to test.');
  }
  const matches = findMatches(pattern, flags, text);
  if (matches.length === 0) return 'No matches found.';
  return `${matches.length} match${matches.length === 1 ? '' : 'es'}:\n${matches
    .map((m) => {
      const groups = m.groups.length ? ` (groups: ${m.groups.join(', ')})` : '';
      return `• "${m.match}" at index ${m.index}${groups}`;
    })
    .join('\n')}`;
}

export function executeAssistantAction(action: AssistantAction): string {
  try {
    switch (action.name) {
      case 'list_tools':
        // What the assistant itself can do, right here in the chat.
        return `Here's what I can do for you right here in the chat:\n${assistantTools
          .map((tool) => `• ${tool.description}`)
          .join('\n')}`;
      case 'list_app_tools':
        // The full catalog of tools available across the Acolyte app.
        return `Acolyte includes these tools:\n${searchableTools
          .map((tool) => `• ${tool.title} — ${tool.description}`)
          .join('\n')}`;
      case 'find_tools': {
        const query = action.input.toLowerCase();
        const results = searchableTools.filter((tool) =>
          [tool.title, tool.description, ...tool.keywords]
            .join(' ')
            .toLowerCase()
            .includes(query),
        );
        return results.length
          ? results
              .map((tool) => `• ${tool.title} — ${tool.description}`)
              .join('\n')
          : 'No matching Acolyte tool was found.';
      }
      case 'open_tool': {
        // Navigation itself is a side effect handled by the component; here we
        // just resolve the target and report it (and keep the action testable).
        const tool = resolveAppTool(action.input);
        return tool
          ? `Opening ${tool.title}…`
          : 'No matching Acolyte tool was found.';
      }
      case 'toggle_theme': {
        const isDark = document.documentElement.classList.contains('dark');
        const theme = isDark ? 'light' : 'dark';

        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        localStorage.setItem('acolyte-theme', theme);
        window.dispatchEvent(new Event('acolyte-theme-change'));

        return `Switched to ${theme} mode.`;
      }
      case 'format_json':
        return JSON.stringify(JSON.parse(action.input), null, 2);
      case 'validate_json':
        JSON.parse(action.input);
        return 'The JSON is valid.';
      case 'minify_json':
        return JSON.stringify(JSON.parse(action.input));
      case 'encode_base64':
        return encodeBase64(action.input);
      case 'decode_base64':
        return decodeBase64(action.input);
      case 'generate_password':
        return generatePassword(action.input);
      case 'decode_jwt':
        return decodeJwt(action.input);
      case 'convert_color':
        return formatColor(action.input);
      case 'test_regex':
        return testRegex(action.input);
    }
  } catch (error) {
    return `Unable to complete ${action.name}: ${
      error instanceof Error ? error.message : 'invalid input'
    }`;
  }
}
