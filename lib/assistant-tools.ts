export interface AssistantTool {
  name: string;
  description: string;
  keywords: string[];
}

export const assistantTools: AssistantTool[] = [
  {
    name: 'find_tools',
    description: 'Find Acolyte tools by topic and explain what they do.',
    keywords: ['tool', 'find', 'help', 'feature'],
  },
  {
    name: 'list_tools',
    description: 'List all available Acolyte tools.',
    keywords: ['tool', 'list', 'all', 'available', 'feature'],
  },
  {
    name: 'toggle_theme',
    description: 'Switch between the light and dark themes.',
    keywords: ['theme', 'dark', 'light', 'appearance', 'preference'],
  },
  {
    name: 'format_json',
    description: 'Format JSON text with two-space indentation.',
    keywords: ['json', 'format', 'prettify'],
  },
  {
    name: 'validate_json',
    description: 'Check whether JSON text is valid.',
    keywords: ['json', 'validate', 'check'],
  },
  {
    name: 'encode_base64',
    description: 'Encode plain text as Base64.',
    keywords: ['base64', 'encode'],
  },
  {
    name: 'decode_base64',
    description: 'Decode Base64 text into plain text.',
    keywords: ['base64', 'decode'],
  },
];
