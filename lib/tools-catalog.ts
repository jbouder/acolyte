/*
 * The catalog of Acolyte tools, without any UI concerns. `lib/tools-data.ts`
 * decorates these entries with icons for the sidebar, home page and search;
 * the MCP Worker (`mcp/`) serves the same list to agents, so it must stay free
 * of React and browser-only imports.
 */

export type ToolCategory = 'API Testing' | 'Analysis' | 'Utilities' | 'Other';

export interface ToolEntry {
  title: string;
  url: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
}

export const homeEntry: ToolEntry = {
  title: 'Home',
  url: '/',
  description: 'Dashboard',
  category: 'Other',
  keywords: ['dashboard', 'main', 'start'],
};

export const toolEntries: ToolEntry[] = [
  {
    title: 'APIs',
    url: '/apis',
    description: 'Test REST API endpoints',
    category: 'API Testing',
    keywords: ['rest', 'http', 'request', 'endpoint', 'fetch', 'curl'],
  },
  {
    title: 'SSE',
    url: '/sse',
    description: 'Server-Sent Events testing',
    category: 'API Testing',
    keywords: ['server-sent', 'events', 'stream', 'realtime', 'eventsource'],
  },
  {
    title: 'WebSockets',
    url: '/websockets',
    description: 'WebSocket connection testing',
    category: 'API Testing',
    keywords: ['ws', 'wss', 'socket', 'realtime', 'bidirectional'],
  },
  {
    title: 'Chat',
    url: '/chat',
    description: 'Chat with OpenAI v1-compatible model providers',
    category: 'API Testing',
    keywords: [
      'genai',
      'ai',
      'chat',
      'llm',
      'openai',
      'ollama',
      'llama.cpp',
      'docker model runner',
    ],
  },
  {
    title: 'Web Stats',
    url: '/web-stats',
    description: 'Website performance statistics',
    category: 'Analysis',
    keywords: ['performance', 'metrics', 'speed', 'lighthouse', 'stats'],
  },
  {
    title: 'Website Analysis',
    url: '/website-analysis',
    description: 'Analyze website structure and metadata',
    category: 'Analysis',
    keywords: ['seo', 'meta', 'headers', 'structure', 'audit'],
  },
  {
    title: 'Accessibility Checker',
    url: '/accessibility-checker',
    description: 'Check website accessibility compliance',
    category: 'Analysis',
    keywords: ['a11y', 'wcag', 'aria', 'screen reader', 'compliance'],
  },
  {
    title: 'Dependency Analysis',
    url: '/dependency-analysis',
    description: 'Analyze project dependencies',
    category: 'Analysis',
    keywords: ['npm', 'packages', 'vulnerabilities', 'outdated', 'deps'],
  },
  {
    title: 'SBOM Report',
    url: '/sbom-report',
    description: 'Software Bill of Materials report',
    category: 'Analysis',
    keywords: ['sbom', 'inventory', 'supply chain', 'components', 'license'],
  },
  {
    title: 'Markdown Preview',
    url: '/markdown-preview',
    description: 'Preview Markdown with live rendering',
    category: 'Utilities',
    keywords: ['md', 'preview', 'render', 'document', 'markup'],
  },
  {
    title: 'Mermaid Preview',
    url: '/mermaid-preview',
    description: 'Preview Mermaid diagrams',
    category: 'Utilities',
    keywords: ['diagram', 'flowchart', 'sequence', 'chart', 'graph'],
  },
  {
    title: 'Swagger Viewer',
    url: '/swagger-viewer',
    description: 'View OpenAPI/Swagger specifications',
    category: 'Utilities',
    keywords: ['openapi', 'api docs', 'specification', 'schema'],
  },
  {
    title: 'Base64 Encoding',
    url: '/base64',
    description: 'Encode and decode Base64 strings',
    category: 'Utilities',
    keywords: ['encode', 'decode', 'base64', 'binary', 'convert'],
  },
  {
    title: 'JSON Formatter',
    url: '/json-formatter',
    description: 'Format and validate JSON data',
    category: 'Utilities',
    keywords: ['json', 'format', 'prettify', 'validate', 'minify'],
  },
  {
    title: 'Regex Tester',
    url: '/regex',
    description: 'Test regular expressions',
    category: 'Utilities',
    keywords: ['regex', 'regexp', 'pattern', 'match', 'test'],
  },
  {
    title: 'Color Picker',
    url: '/color-picker',
    description: 'Pick and convert colors',
    category: 'Utilities',
    keywords: ['color', 'hex', 'rgb', 'hsl', 'picker', 'convert'],
  },
  {
    title: 'Image Tools',
    url: '/image-tools',
    description: 'Crop, resize, convert, and generate favicons',
    category: 'Utilities',
    keywords: [
      'image',
      'crop',
      'resize',
      'convert',
      'favicon',
      'png',
      'jpeg',
      'webp',
    ],
  },
  {
    title: 'JWT Decoder',
    url: '/jwt',
    description: 'Decode and inspect JSON Web Tokens',
    category: 'Utilities',
    keywords: ['jwt', 'token', 'decode', 'auth', 'claims'],
  },
  {
    title: 'Password Generator',
    url: '/password-generator',
    description: 'Generate secure random passwords',
    category: 'Utilities',
    keywords: [
      'password',
      'generator',
      'random',
      'secure',
      'pin',
      'passphrase',
      'crypto',
    ],
  },
  {
    title: 'Notepad',
    url: '/notepad',
    description: 'Quick notes and scratch pad',
    category: 'Utilities',
    keywords: ['notes', 'text', 'scratch', 'editor', 'write'],
  },
  {
    title: 'Games',
    url: '/games',
    description: 'Browser-based developer games',
    category: 'Other',
    keywords: ['games', 'fun', 'play', 'break'],
  },
];

// Case-insensitive substring search over title, description and keywords.
export function searchToolEntries(query: string): ToolEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return toolEntries;
  return toolEntries.filter((tool) =>
    [tool.title, tool.description, ...tool.keywords]
      .join(' ')
      .toLowerCase()
      .includes(q),
  );
}
