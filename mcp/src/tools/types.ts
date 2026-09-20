import type { z } from 'zod';
import type { Env } from '../env';

/**
 * A tool definition decoupled from the MCP SDK so the handlers can be unit
 * tested directly and registered against the server in one place
 * (`../server.ts`).
 */
export interface ToolDefinition<Schema extends z.ZodObject = z.ZodObject> {
  name: string;
  title: string;
  description: string;
  inputSchema: Schema;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  handler: (
    args: z.infer<Schema>,
    env: Env,
  ) => Promise<ToolOutput> | ToolOutput;
}

/** Plain text, or a JSON-serialisable value that is pretty-printed for the client. */
export type ToolOutput = string | { json: unknown };

// Helper that keeps the generic inference tidy at each definition site.
export function defineTool<Schema extends z.ZodObject>(
  tool: ToolDefinition<Schema>,
): ToolDefinition<Schema> {
  return tool;
}

export function renderOutput(output: ToolOutput): string {
  return typeof output === 'string'
    ? output
    : JSON.stringify(output.json, null, 2);
}
