/**
 * Worker bindings available to server code (route handlers, server components).
 *
 * This is hand-written rather than generated with `wrangler types`. The
 * generated worker-configuration.d.ts declares the full workerd runtime in the
 * global scope, which replaces the DOM's `Response`/`Request` and breaks every
 * client component in this app that calls `res.json()`. Acolyte is mostly
 * browser code with a thin server edge, so the DOM types win and the one
 * binding we use is declared here.
 *
 * Bindings are configured in wrangler.jsonc — add them in both places.
 */
declare module 'cloudflare:workers' {
  import type { BrowserWorker } from '@cloudflare/puppeteer';

  export const env: {
    /** Cloudflare Browser Rendering, used by /api/accessibility-check. */
    BROWSER?: BrowserWorker;
  };
}
