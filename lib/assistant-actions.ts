import { assistantTools } from '@/lib/assistant-tools';
import { searchableTools } from '@/lib/tools-data';

export type AssistantActionName =
  | 'find_tools'
  | 'list_tools'
  | 'toggle_theme'
  | 'format_json'
  | 'validate_json'
  | 'encode_base64'
  | 'decode_base64';

export interface AssistantAction {
  name: AssistantActionName;
  input: string;
}

function getCommandInput(message: string, pattern: RegExp) {
  return message
    .replace(pattern, '')
    .trim()
    .replace(/^[:-]\s*/, '');
}

export function getAssistantAction(message: string): AssistantAction | null {
  const normalized = message.trim().toLowerCase();

  if (
    /\b(list|show)\b.*\b(tools?|features?)\b/.test(normalized) ||
    /\bwhat\b.*\btools?\b/.test(normalized)
  ) {
    return { name: 'list_tools', input: '' };
  }

  if (
    /\b(toggle|switch|change|set)\b.*\b(theme|dark|light)\b/.test(normalized) ||
    /\b(dark|light)\s+mode\b/.test(normalized)
  ) {
    return { name: 'toggle_theme', input: '' };
  }

  const actionPatterns: Array<[AssistantActionName, RegExp]> = [
    ['format_json', /\b(?:format|prettify|beautify)\s+(?:this\s+)?json\b/i],
    ['validate_json', /\b(?:validate|check)\s+(?:this\s+)?json\b/i],
    ['encode_base64', /\bencode\s+(?:this\s+)?(?:text\s+)?(?:as\s+)?base64\b/i],
    ['decode_base64', /\bdecode\s+(?:this\s+)?base64\b/i],
  ];

  for (const [name, pattern] of actionPatterns) {
    if (pattern.test(message)) {
      return { name, input: getCommandInput(message, pattern) };
    }
  }

  const encodeMatch = message.match(/\bencode\s+(.+?)\s+(?:as|to)\s+base64\b/i);
  if (encodeMatch) return { name: 'encode_base64', input: encodeMatch[1] };

  const decodeMatch = message.match(/\bdecode\s+(.+?)\s+from\s+base64\b/i);
  if (decodeMatch) return { name: 'decode_base64', input: decodeMatch[1] };

  const findMatch = message.match(
    /\b(?:find|search for)\s+(?:tools?\s+(?:for|about)\s+)?(.+)/i,
  );
  if (findMatch && /\btools?\b/.test(normalized)) {
    return { name: 'find_tools', input: findMatch[1] };
  }

  return null;
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

export function executeAssistantAction(action: AssistantAction): string {
  try {
    switch (action.name) {
      case 'find_tools': {
        const query = action.input.toLowerCase();
        const results = assistantTools.filter((tool) =>
          [tool.name, tool.description, ...tool.keywords]
            .join(' ')
            .toLowerCase()
            .includes(query),
        );
        return results.length
          ? results
              .map((tool) => `${tool.name}: ${tool.description}`)
              .join('\n')
          : 'No matching assistant action was found.';
      }
      case 'list_tools':
        return searchableTools
          .map((tool) => `${tool.title}: ${tool.description}`)
          .join('\n');
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
      case 'encode_base64':
        return encodeBase64(action.input);
      case 'decode_base64':
        return decodeBase64(action.input);
    }
  } catch (error) {
    return `Unable to complete ${action.name}: ${
      error instanceof Error ? error.message : 'invalid input'
    }`;
  }
}
