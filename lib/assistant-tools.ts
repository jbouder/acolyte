export interface AssistantTool {
  name: string;
  description: string;
  keywords: string[];
}

export const assistantTools: AssistantTool[] = [
  {
    name: 'list_tools',
    description: 'List everything I can do for you right here in the chat.',
    keywords: ['list', 'tools', 'capabilities', 'help', 'can', 'do', 'skills'],
  },
  {
    name: 'list_app_tools',
    description: 'List all of the tools available across the Acolyte app.',
    keywords: ['app', 'tools', 'features', 'pages', 'available', 'catalog'],
  },
  {
    name: 'find_tools',
    description: 'Find an Acolyte app tool by topic or keyword.',
    keywords: ['find', 'search', 'tool', 'topic', 'which', 'feature'],
  },
  {
    name: 'open_tool',
    description: 'Open (navigate to) an Acolyte tool by name.',
    keywords: ['open', 'go', 'navigate', 'launch', 'show', 'take'],
  },
  {
    name: 'toggle_theme',
    description: 'Switch between the light and dark themes.',
    keywords: ['theme', 'dark', 'light', 'appearance', 'preference'],
  },
  {
    name: 'format_json',
    description: 'Format (pretty-print) JSON text with two-space indentation.',
    keywords: ['json', 'format', 'prettify', 'beautify'],
  },
  {
    name: 'validate_json',
    description: 'Check whether JSON text is valid.',
    keywords: ['json', 'validate', 'check', 'lint'],
  },
  {
    name: 'minify_json',
    description: 'Minify JSON text into a single compact line.',
    keywords: ['json', 'minify', 'compact', 'compress'],
  },
  {
    name: 'encode_base64',
    description: 'Encode plain text as Base64.',
    keywords: ['base64', 'encode'],
  },
  {
    name: 'decode_base64',
    description: 'Decode Base64 text back into plain text.',
    keywords: ['base64', 'decode'],
  },
  {
    name: 'generate_password',
    description:
      'Generate a strong, random password (give a number to set the length; the default is 20).',
    keywords: ['password', 'generate', 'random', 'secure', 'passphrase', 'pin'],
  },
  {
    name: 'decode_jwt',
    description:
      'Decode a JSON Web Token (JWT) and show its header and payload.',
    keywords: ['jwt', 'token', 'decode', 'auth', 'claims'],
  },
  {
    name: 'convert_color',
    description: 'Convert a color between HEX, RGB, and HSL.',
    keywords: ['color', 'hex', 'rgb', 'hsl', 'convert'],
  },
  {
    name: 'test_regex',
    description:
      'Test a regular expression against sample text and list matches.',
    keywords: ['regex', 'regexp', 'pattern', 'match', 'test'],
  },
];
