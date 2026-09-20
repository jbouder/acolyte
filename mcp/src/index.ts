import { createMcpHandler } from 'agents/mcp/server';
import type { Env } from './env';
import { createServer, SERVER_INFO } from './server';
import { tools } from './tools';

const MCP_ROUTE = '/mcp';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Constant-time comparison so a token can't be recovered by timing responses.
async function tokensMatch(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const va = new Uint8Array(da);
  const vb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  if (!env.MCP_AUTH_TOKEN) return true;
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  return token.length > 0 && tokensMatch(token, env.MCP_AUTH_TOKEN);
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    // A small landing/health document so the Worker is self-describing.
    if (pathname === '/' || pathname === '/health') {
      return new Response(
        JSON.stringify(
          {
            name: SERVER_INFO.name,
            version: SERVER_INFO.version,
            endpoint: MCP_ROUTE,
            transport: 'streamable-http',
            authRequired: Boolean(env.MCP_AUTH_TOKEN),
            tools: tools.map((tool) => tool.name),
          },
          null,
          2,
        ),
        { headers: JSON_HEADERS },
      );
    }

    if (pathname !== MCP_ROUTE) {
      return new Response('Not found', { status: 404 });
    }

    // CORS preflight never carries credentials; let the handler answer it.
    if (request.method !== 'OPTIONS' && !(await isAuthorized(request, env))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          ...JSON_HEADERS,
          'WWW-Authenticate': 'Bearer realm="acolyte-mcp"',
        },
      });
    }

    const handler = createMcpHandler(() => createServer(env), {
      route: MCP_ROUTE,
    });
    return handler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
