import {
  BarChart3,
  BookOpen,
  BotMessageSquare,
  Braces,
  Cable,
  Code2,
  Eye,
  FileText,
  Gamepad2,
  GitBranch,
  GitGraph,
  Home,
  ImageIcon,
  Key,
  KeyRound,
  type LucideIcon,
  PackageSearch,
  Palette,
  ScanEye,
  SearchCode,
  Settings,
  StickyNote,
  Wrench,
  Zap,
} from 'lucide-react';

import {
  homeEntry,
  type ToolCategory,
  type ToolEntry,
  toolEntries,
} from '@/lib/tools-catalog';

export type { ToolCategory };

export interface CategoryTone {
  /** Solid fill, for the small legend swatches. */
  swatch: string;
  /** Badge fill and text, for chips and pills. */
  chip: string;
  /** Left-edge rule that colour-codes a panel. */
  edge: string;
}

/*
 * One bright accent per category, so a tool is identifiable by colour before
 * it is read. The `tone-*` colours are defined in `app/globals.css`; the class
 * names are spelled out in full because Tailwind only sees literal strings.
 *
 * Chips invert between themes: the solid tone with knocked-out text in light
 * mode, and the deep `-soft` fill with bright tone text in dark mode. A pale
 * fill looks washed out on white, and a solid one is too loud on black.
 * Hover dips opacity rather than swapping colours, so one rule covers both.
 */
export const categoryTones: Record<ToolCategory, CategoryTone> = {
  'API Testing': {
    swatch: 'bg-tone-violet',
    chip: 'bg-tone-violet text-background dark:bg-tone-violet-soft dark:text-tone-violet',
    edge: 'border-l-tone-violet',
  },
  Analysis: {
    swatch: 'bg-tone-cyan',
    chip: 'bg-tone-cyan text-background dark:bg-tone-cyan-soft dark:text-tone-cyan',
    edge: 'border-l-tone-cyan',
  },
  Utilities: {
    swatch: 'bg-tone-amber',
    chip: 'bg-tone-amber text-background dark:bg-tone-amber-soft dark:text-tone-amber',
    edge: 'border-l-tone-amber',
  },
  Other: {
    swatch: 'bg-tone-green',
    chip: 'bg-tone-green text-background dark:bg-tone-green-soft dark:text-tone-green',
    edge: 'border-l-tone-green',
  },
};

export interface Tool extends ToolEntry {
  icon: LucideIcon;
}

/*
 * Icons are the only thing the UI adds to the shared catalog in
 * `lib/tools-catalog.ts`. A tool added there without an entry here falls back
 * to the generic Wrench icon rather than breaking the sidebar.
 */
const icons: Record<string, LucideIcon> = {
  '/': Home,
  '/apis': Code2,
  '/sse': Zap,
  '/websockets': Cable,
  '/chat': BotMessageSquare,
  '/web-stats': Settings,
  '/website-analysis': BarChart3,
  '/accessibility-checker': ScanEye,
  '/dependency-analysis': GitBranch,
  '/sbom-report': PackageSearch,
  '/markdown-preview': Eye,
  '/mermaid-preview': GitGraph,
  '/swagger-viewer': BookOpen,
  '/base64': FileText,
  '/json-formatter': Braces,
  '/regex': SearchCode,
  '/color-picker': Palette,
  '/image-tools': ImageIcon,
  '/jwt': Key,
  '/password-generator': KeyRound,
  '/notepad': StickyNote,
  '/games': Gamepad2,
};

const withIcon = (entry: ToolEntry): Tool => ({
  ...entry,
  icon: icons[entry.url] ?? Wrench,
});

const home = withIcon(homeEntry);
const tools = toolEntries.map(withIcon);

export const allTools = [home, ...tools];

export const searchableTools = tools;
