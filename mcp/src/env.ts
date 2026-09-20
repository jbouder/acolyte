import type { BrowserWorker } from '@cloudflare/puppeteer';

/**
 * Bindings and variables available to the MCP Worker. Configured in
 * wrangler.jsonc; secrets are set with `wrangler secret put`.
 */
export interface Env {
  /** Cloudflare Browser Rendering, used by the check_accessibility tool. */
  BROWSER?: BrowserWorker;
  /** Public origin of the Acolyte web app, for links in catalog results. */
  ACOLYTE_APP_URL?: string;
  /** Optional shared secret; when set, requests need a matching Bearer token. */
  MCP_AUTH_TOKEN?: string;
}
