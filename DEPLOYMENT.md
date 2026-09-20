# Deployment Guide

Acolyte runs on **Cloudflare Workers**. The Next.js App Router source is built by
[vinext](https://github.com/cloudflare/vinext) (Next.js on Vite) and deployed
with Wrangler to a Worker named `project-acolyte`.

## Commands

```bash
npm run dev      # vinext dev server
npm run build    # production build -> dist/client + dist/server
npm run start    # run the built Worker locally via wrangler dev
npm run deploy   # build + deploy to Cloudflare
```

`npm run deploy` runs `vinext-cloudflare deploy`, which performs its own
production build and then hands the generated `dist/server/wrangler.json` to
Wrangler.

## Continuous deployment

`.github/workflows/deploy.yml` deploys on every push to `main` (and on manual
dispatch). It runs Biome and the test suite first, then deploys. Authentication
comes from two repository secrets:

| Secret                  | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Token with Workers Scripts:Edit          |
| `CLOUDFLARE_ACCOUNT_ID` | The account that owns `project-acolyte`  |

`.github/workflows/code-quality.yml` still runs the same checks on pull
requests.

## Configuration

`wrangler.jsonc` is the source of truth for the Worker. Notable entries:

- `main: vinext/server/fetch-handler` — the vinext Worker entrypoint.
- `assets` — static output from `dist/client`, served ahead of the Worker.
- `compatibility_flags: ["nodejs_compat"]` — required by vinext.
- `browser` — the Browser Rendering binding (see below).

Custom domains are not configured yet. To add one, put a `routes` entry in
`wrangler.jsonc`:

```jsonc
"routes": [{ "pattern": "acolyte.example.com", "custom_domain": true }]
```

The zone must live in the same Cloudflare account; DNS records are created on
deploy.

### Worker size

Workers are capped at 3 MiB compressed on the Free plan and 10 MiB on Paid.
`mermaid` and `@mlc-ai/web-llm` are browser-only but would otherwise be emitted
into the server bundle as well, which alone pushed the Worker past 4 MiB
compressed. `vite.config.ts` marks both external for the `ssr` and `rsc`
environments, which keeps the upload around 700 KiB compressed. If you add
another large browser-only dependency, add it to that list.

Check the current size without deploying:

```bash
npm run build
npx wrangler deploy --dry-run --config dist/server/wrangler.json
```

## Accessibility Checker — Browser Rendering

The Accessibility Checker (`app/api/accessibility-check/route.ts`) drives a
headless Chrome through [Cloudflare Browser
Rendering](https://developers.cloudflare.com/browser-rendering/) and runs
axe-core against the target page.

It uses the `BROWSER` binding declared in `wrangler.jsonc`:

```jsonc
"browser": {
  "binding": "BROWSER",
  "remote": true
}
```

`remote: true` makes local development talk to a real headless browser in
Cloudflare rather than a stub, so `npm run dev` and `npm run start` behave the
same as production. It has no effect on a deployed Worker.

The binding is typed in `cloudflare-env.d.ts`. That file is hand-written on
purpose — `wrangler types` generates a `worker-configuration.d.ts` that declares
the whole workerd runtime globally, which replaces the DOM's `Request`/`Response`
and breaks every client component that calls `res.json()`. Acolyte is mostly
browser code, so the DOM types win and only the bindings actually used are
declared by hand. Add new bindings to both `wrangler.jsonc` and
`cloudflare-env.d.ts`.

### Limits

Browser Rendering is metered per account:

| Plan | Browser minutes | Concurrent browsers | Instance timeout |
| ---- | --------------- | ------------------- | ---------------- |
| Free | 10 / day        | 3                   | 60s              |
| Paid | unlimited       | 200                 | 60s (extendable) |

A single scan takes roughly 5–10 seconds. The route closes its browser in a
`finally` block so a failed scan cannot hold one of the concurrency slots, and
navigation is capped at 20s to stay inside the 60s instance timeout.

### Troubleshooting

- **503 "Browser Rendering is unavailable"** — the `BROWSER` binding is missing.
  Confirm it is in `wrangler.jsonc` and redeploy.
- **408 timeouts** — the target site is slow or blocks headless Chrome. The
  route waits for `networkidle2` with a 20s cap.
- **Errors under load** — you are likely at the concurrent-browser limit. Free
  accounts get 3.

Live logs for a deployed Worker:

```bash
npx wrangler tail project-acolyte
```
