import { z } from 'zod';
import { searchToolEntries, type ToolEntry } from '@/lib/tools-catalog';
import type { Env } from '../env';
import { defineTool } from './types';

const readOnly = { readOnlyHint: true, idempotentHint: true };

// Attach an absolute link when the Worker knows where the app lives.
function withLink(entry: ToolEntry, env: Env) {
  const base = env.ACOLYTE_APP_URL?.replace(/\/$/, '');
  return {
    ...entry,
    link: base ? `${base}${entry.url}` : entry.url,
  };
}

export const listAcolyteTools = defineTool({
  name: 'list_acolyte_tools',
  title: 'List Acolyte tools',
  description:
    'List every tool page in the Acolyte web app, grouped by category, with links. Use it to discover what Acolyte can do beyond this MCP server.',
  inputSchema: z.object({
    category: z
      .enum(['API Testing', 'Analysis', 'Utilities', 'Other'])
      .optional()
      .describe('Limit the list to one category.'),
  }),
  annotations: readOnly,
  handler: ({ category }, env) => {
    const entries = searchToolEntries('').filter(
      (tool) => !category || tool.category === category,
    );
    return {
      json: {
        count: entries.length,
        tools: entries.map((t) => withLink(t, env)),
      },
    };
  },
});

export const findAcolyteTool = defineTool({
  name: 'find_acolyte_tool',
  title: 'Find an Acolyte tool',
  description:
    'Search the Acolyte tool catalog by topic or keyword (e.g. "jwt", "diagram", "a11y").',
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe('Free-text search over titles, descriptions and keywords.'),
  }),
  annotations: readOnly,
  handler: ({ query }, env) => {
    const entries = searchToolEntries(query);
    return {
      json: {
        count: entries.length,
        tools: entries.map((t) => withLink(t, env)),
      },
    };
  },
});

export const catalogTools = [listAcolyteTools, findAcolyteTool];
