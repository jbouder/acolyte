import {
  BarChart3,
  BookOpen,
  Braces,
  Cable,
  Code2,
  Eye,
  FileText,
  Gamepad2,
  GitBranch,
  GitGraph,
  Home,
  Key,
  type LucideIcon,
  PackageSearch,
  Palette,
  ScanEye,
  SearchCode,
  Settings,
  StickyNote,
  Wifi,
  Zap,
} from 'lucide-react';

export type ToolCategory =
  | 'API Testing'
  | 'Analysis'
  | 'Utilities'
  | 'Other';

export interface Tool {
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
  category: ToolCategory;
  keywords: string[];
}

const home: Tool = {
  title: 'Home',
  url: '/',
  icon: Home,
  description: 'Dashboard',
  category: 'Other',
  keywords: ['dashboard', 'main', 'start'],
};

const tools: Tool[] = [
  {
    title: 'APIs',
    url: '/apis',
    icon: Code2,
    description: 'Test REST API endpoints',
    category: 'API Testing',
    keywords: ['rest', 'http', 'request', 'endpoint', 'fetch', 'curl'],
  },
  {
    title: 'SSE',
    url: '/sse',
    icon: Zap,
    description: 'Server-Sent Events testing',
    category: 'API Testing',
    keywords: ['server-sent', 'events', 'stream', 'realtime', 'eventsource'],
  },
  {
    title: 'WebSockets',
    url: '/websockets',
    icon: Cable,
    description: 'WebSocket connection testing',
    category: 'API Testing',
    keywords: ['ws', 'wss', 'socket', 'realtime', 'bidirectional'],
  },
  {
    title: 'WebTransport',
    url: '/webtransport',
    icon: Wifi,
    description: 'WebTransport protocol testing',
    category: 'API Testing',
    keywords: ['http3', 'quic', 'transport', 'protocol'],
  },
  {
    title: 'Web Stats',
    url: '/web-stats',
    icon: Settings,
    description: 'Website performance statistics',
    category: 'Analysis',
    keywords: ['performance', 'metrics', 'speed', 'lighthouse', 'stats'],
  },
  {
    title: 'Website Analysis',
    url: '/website-analysis',
    icon: BarChart3,
    description: 'Analyze website structure and metadata',
    category: 'Analysis',
    keywords: ['seo', 'meta', 'headers', 'structure', 'audit'],
  },
  {
    title: 'Accessibility Checker',
    url: '/accessibility-checker',
    icon: ScanEye,
    description: 'Check website accessibility compliance',
    category: 'Analysis',
    keywords: ['a11y', 'wcag', 'aria', 'screen reader', 'compliance'],
  },
  {
    title: 'Dependency Analysis',
    url: '/dependency-analysis',
    icon: GitBranch,
    description: 'Analyze project dependencies',
    category: 'Analysis',
    keywords: ['npm', 'packages', 'vulnerabilities', 'outdated', 'deps'],
  },
  {
    title: 'SBOM Report',
    url: '/sbom-report',
    icon: PackageSearch,
    description: 'Software Bill of Materials report',
    category: 'Analysis',
    keywords: ['sbom', 'inventory', 'supply chain', 'components', 'license'],
  },
  {
    title: 'Markdown Preview',
    url: '/markdown-preview',
    icon: Eye,
    description: 'Preview Markdown with live rendering',
    category: 'Utilities',
    keywords: ['md', 'preview', 'render', 'document', 'markup'],
  },
  {
    title: 'Mermaid Preview',
    url: '/mermaid-preview',
    icon: GitGraph,
    description: 'Preview Mermaid diagrams',
    category: 'Utilities',
    keywords: ['diagram', 'flowchart', 'sequence', 'chart', 'graph'],
  },
  {
    title: 'Swagger Viewer',
    url: '/swagger-viewer',
    icon: BookOpen,
    description: 'View OpenAPI/Swagger specifications',
    category: 'Utilities',
    keywords: ['openapi', 'api docs', 'specification', 'schema'],
  },
  {
    title: 'Base64 Encoding',
    url: '/base64',
    icon: FileText,
    description: 'Encode and decode Base64 strings',
    category: 'Utilities',
    keywords: ['encode', 'decode', 'base64', 'binary', 'convert'],
  },
  {
    title: 'JSON Formatter',
    url: '/json-formatter',
    icon: Braces,
    description: 'Format and validate JSON data',
    category: 'Utilities',
    keywords: ['json', 'format', 'prettify', 'validate', 'minify'],
  },
  {
    title: 'Regex Tester',
    url: '/regex',
    icon: SearchCode,
    description: 'Test regular expressions',
    category: 'Utilities',
    keywords: ['regex', 'regexp', 'pattern', 'match', 'test'],
  },
  {
    title: 'Color Picker',
    url: '/color-picker',
    icon: Palette,
    description: 'Pick and convert colors',
    category: 'Utilities',
    keywords: ['color', 'hex', 'rgb', 'hsl', 'picker', 'convert'],
  },
  {
    title: 'JWT Decoder',
    url: '/jwt',
    icon: Key,
    description: 'Decode and inspect JSON Web Tokens',
    category: 'Utilities',
    keywords: ['jwt', 'token', 'decode', 'auth', 'claims'],
  },
  {
    title: 'Notepad',
    url: '/notepad',
    icon: StickyNote,
    description: 'Quick notes and scratch pad',
    category: 'Utilities',
    keywords: ['notes', 'text', 'scratch', 'editor', 'write'],
  },
  {
    title: 'Games',
    url: '/games',
    icon: Gamepad2,
    description: 'Browser-based developer games',
    category: 'Other',
    keywords: ['games', 'fun', 'play', 'break'],
  },
];

export const allTools = [home, ...tools];

export const searchableTools = tools;
