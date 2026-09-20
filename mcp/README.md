# Acolyte MCP Server

A remote [Model Context Protocol](https://modelcontextprotocol.io/) server that
exposes Acolyte's developer tools to AI agents. It runs as its own Cloudflare
Worker (`project-acolyte-mcp`) next to the web app and shares the tool
implementations in [`../lib`](../lib), so a fix in the app is a fix here too.

The transport is **Streamable HTTP** at `/mcp`, served by
[`createMcpHandler`](https://developers.cloudflare.com/agents/model-context-protocol/apis/handler-api/)
from the Cloudflare Agents SDK. The server is stateless: every request builds a
fresh `McpServer`, so there are no sessions, Durable Objects or storage to
manage.

## Tools

| Tool                   | Mirrors                | What it does                                                             |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `list_acolyte_tools`   | Home / sidebar         | Catalog of every Acolyte page, optionally filtered by category            |
| `find_acolyte_tool`    | Site search            | Keyword search over the catalog                                           |
| `format_json`          | JSON Formatter         | Pretty-print JSON with a configurable indent                             |
| `validate_json`        | JSON Formatter         | Report whether text is valid JSON (and the parse error if not)            |
| `minify_json`          | JSON Formatter         | Collapse JSON to one line                                                 |
| `encode_base64`        | Base64 Encoding        | UTF-8 text → Base64                                                       |
| `decode_base64`        | Base64 Encoding        | Base64 → UTF-8 text                                                       |
| `decode_jwt`           | JWT Decoder            | Header, payload, expiry status, ISO timestamps, optional HS256 check      |
| `convert_color`        | Color Picker           | HEX ⇄ RGB ⇄ HSL                                                           |
| `test_regex`           | Regex Tester           | Every match with index and capture groups                                 |
| `generate_password`    | Password Generator     | Presets (`strong`, `easy`, `pin`) plus per-option overrides               |
| `http_request`         | APIs                   | Send a request, get status/headers/timing/body                            |
| `read_sse`             | SSE                    | Collect events from a `text/event-stream` endpoint                        |
| `websocket_send`       | WebSockets             | Open a socket, send messages, collect replies                             |
| `analyze_website`      | Website Analysis       | Timing, security headers, content stats, framework/CMS/analytics hints    |
| `check_accessibility`  | Accessibility Checker  | axe-core WCAG scan via Cloudflare Browser Rendering                       |
| `analyze_package_json` | Dependency Analysis    | Dependency summary, optionally with OSV vulnerability lookups             |
| `check_vulnerabilities`| Dependency Analysis    | OSV lookups for a list of npm packages                                    |
| `dependency_tree`      | Dependency Analysis    | Resolve a package's tree from the npm registry (3 levels)                 |
| `summarize_sbom`       | SBOM Report            | SPDX package/license/supplier statistics                                  |
| `inspect_openapi`      | Swagger Viewer         | Endpoint list from an OpenAPI/Swagger spec (JSON or YAML, inline or URL)  |

`GET /` (or `/health`) returns a JSON description of the server and its tool
names.

## Connecting a client

The endpoint is `https://project-acolyte-mcp.<account>.workers.dev/mcp` once
deployed (or `http://localhost:8787/mcp` under `npm run mcp:dev`).

**Claude Code**

```bash
claude mcp add --transport http acolyte https://project-acolyte-mcp.<account>.workers.dev/mcp
# with a token:
claude mcp add --transport http acolyte https://…/mcp --header "Authorization: Bearer <token>"
```

**Claude Desktop / claude.ai** — add a custom connector with the same URL.

**Cursor / other Streamable HTTP clients**

```json
{
  "mcpServers": {
    "acolyte": {
      "url": "https://project-acolyte-mcp.<account>.workers.dev/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  }
}
```

**MCP Inspector**

```bash
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP, URL: http://localhost:8787/mcp
```

## Development

From the repository root (the `mcp` folder is an npm workspace, so a single
`npm install` covers both packages):

```bash
npm run mcp:dev        # wrangler dev on http://localhost:8787
npm run mcp:typecheck  # tsc against the Workers runtime types
npm test               # __tests__/mcp-tools.test.ts exercises every tool handler
npm run mcp:deploy     # wrangler deploy
```

Or from inside `mcp/`: `npm run dev`, `npm run typecheck`, `npm run deploy`,
`npm run size` (dry-run bundle).

Quick manual check against a running server:

```bash
curl -s http://localhost:8787/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"format_json","arguments":{"json":"{\"a\":1}"}}}'
```

### Layout

```
mcp/
├── wrangler.jsonc        # Worker name, bindings, vars
├── tsconfig.json         # Workers runtime types; `@/` resolves to the repo root
└── src/
    ├── index.ts          # fetch handler: health route, bearer auth, createMcpHandler
    ├── server.ts         # builds an McpServer and registers every tool
    ├── env.ts            # Env bindings/vars type
    └── tools/
        ├── types.ts      # ToolDefinition + defineTool helper
        ├── catalog.ts    # list/find Acolyte tools
        ├── utilities.ts  # JSON, Base64, JWT, color, regex, passwords
        ├── api-testing.ts# HTTP, SSE, WebSocket probes
        └── analysis.ts   # website, accessibility, dependencies, SBOM, OpenAPI
```

Tools are plain objects (`defineTool`) with a zod input schema and a handler
that receives the validated arguments and `env`. `server.ts` adapts them to the
SDK, which keeps the handlers unit-testable without any MCP plumbing. To add a
tool, define it in the matching file, append it to that file's export array,
and add a case to `__tests__/mcp-tools.test.ts`.

Shared logic belongs in `../lib` (pure helpers) or `../lib/server` (helpers
that fetch or need bindings), never in `mcp/src`, so the web app and the MCP
server stay in step.

## Configuration

`wrangler.jsonc` declares:

- `browser` — the `BROWSER` Browser Rendering binding for `check_accessibility`.
  Same limits as the app's Accessibility Checker (see
  [DEPLOYMENT.md](../DEPLOYMENT.md)).
- `vars.ACOLYTE_APP_URL` — public origin of the web app, used to build links in
  catalog results. Empty by default (paths only).

Secrets (`npx wrangler secret put <NAME> --config wrangler.jsonc` from `mcp/`):

- `MCP_AUTH_TOKEN` — optional. When set, every `/mcp` request must carry
  `Authorization: Bearer <token>`; anything else gets a 401. The server is
  open (like the web app's own API routes) when it is unset, so set this before
  exposing the Worker beyond personal use, or put it behind Cloudflare Access.

Host validation: `createMcpHandler` accepts `localhost` and the Worker's
`workers.dev` hostname by default. When you attach a custom domain, pass it in
`allowedHostnames` in `src/index.ts`.

## Deployment

`.github/workflows/deploy.yml` deploys this Worker (`deploy-mcp` job) alongside
the app on every push to `main`, using the same `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` secrets.

The scripts pass `--config wrangler.jsonc` explicitly. Without it, Wrangler
walks up the tree, finds the app's generated `.wrangler/deploy/config.json`
at the repository root and refuses to choose between the two.
