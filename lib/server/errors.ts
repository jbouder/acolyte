/*
 * Error type shared by the server-side tool implementations in `lib/server/`.
 * The Next.js route handlers map `status` onto the HTTP response; the MCP
 * Worker reports `message` back to the calling agent.
 */
export class ToolError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ToolError';
    this.status = status;
  }
}

// Narrow an unknown URL string to a validated, absolute http(s) URL.
export function parseHttpUrl(value: unknown): URL {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ToolError('URL is required', 400);
  }
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new ToolError('Invalid URL format', 400);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ToolError('Only http and https URLs are supported', 400);
  }
  return url;
}
