import { assistantTools } from '@/lib/assistant-tools';

export type AssistantActionName =
  | 'find_tools'
  | 'format_json'
  | 'validate_json'
  | 'encode_base64'
  | 'decode_base64';

export interface AssistantAction {
  name: AssistantActionName;
  input: string;
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
          ? results.map((tool) => `${tool.name}: ${tool.description}`).join('\n')
          : 'No matching assistant action was found.';
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
