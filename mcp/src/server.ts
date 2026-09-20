import { McpServer } from '@modelcontextprotocol/server';
import type { Env } from './env';
import { tools } from './tools';
import { renderOutput } from './tools/types';

export const SERVER_INFO = {
  name: 'acolyte',
  title: 'Acolyte Developer Tools',
  version: '0.1.0',
} as const;

const INSTRUCTIONS = `Acolyte is a developer tool suite. This server exposes its tools to agents:
JSON, Base64, JWT, color and regex utilities; password generation; HTTP, SSE and
WebSocket probes; website, accessibility, dependency, SBOM and OpenAPI analysis.
Use list_acolyte_tools to see the matching pages in the web app.`;

// Build a fresh server for each request. The handler is stateless, so this is
// cheap and keeps requests isolated from one another.
export function createServer(env: Env): McpServer {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
      },
      async (args) => {
        try {
          const output = await tool.handler(args, env);
          return { content: [{ type: 'text', text: renderOutput(output) }] };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: error instanceof Error ? error.message : String(error),
              },
            ],
          };
        }
      },
    );
  }

  return server;
}
