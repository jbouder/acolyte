---
sidebar_position: 6
title: Deployment
---

# Deployment

Acolyte is optimized for **Vercel** and other serverless platforms. The only piece
that needs special attention is the
[Accessibility Checker](./tools/analysis/accessibility-checker.md), which runs a
headless browser.

## Vercel (recommended)

No special configuration is required.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jbouder/acolyte)

1. Connect the repository to Vercel.
2. Vercel detects Next.js and builds with `npm run build`.
3. Deploy.

The [`@sparticuz/chromium`](https://github.com/Sparticuz/chromium) package
provides a serverless-optimized Chromium binary that the Accessibility Checker
uses automatically in production.

## Headless browser (Accessibility Checker)

The checker detects its environment:

- **Development** — uses your local Chrome installation.
- **Production / serverless** — uses the bundled `@sparticuz/chromium` binary.

### Local development override

If Chrome is installed in a non-standard location, set:

```bash
PUPPETEER_EXECUTABLE_PATH=/path/to/your/chrome
```

| OS | Typical path |
| --- | --- |
| macOS | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| Linux | `/usr/bin/google-chrome` |
| Windows | `C:\Program Files\Google\Chrome\Application\chrome.exe` |

### Testing the serverless path locally

```bash
NODE_ENV=production npm run dev
```

This forces use of the serverless Chromium binary instead of local Chrome.

## Other platforms

The same configuration works on **AWS Lambda**, **Netlify Functions**, and
**Google Cloud Functions**. For the Accessibility Checker, ensure:

- **Function timeout** is at least **30 seconds** (the free Vercel tier defaults
  to ~10s).
- **Memory** is at least **1 GB** — Chromium is memory-hungry.

### Docker

When deploying with Docker, install Chromium in the image and point Puppeteer at
it:

```dockerfile
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

## Troubleshooting

| Symptom | Likely cause & fix |
| --- | --- |
| **Accessibility scan times out** | Increase the serverless function timeout (≥30s). |
| **Out-of-memory during scan** | Allocate at least 1 GB of memory to the function. |
| **`@sparticuz/chromium` not found at build** | Confirm it's in `dependencies` (not `devDependencies`). |

## Performance considerations

- Each accessibility scan launches a fresh browser instance — this is inherently
  resource-intensive.
- Consider rate-limiting the accessibility endpoint and caching results where
  possible.

:::tip
This page covers deploying **the Acolyte app**. To deploy **this documentation
site**, see the [docs CI/CD workflow](./contributing.md#documentation), which
publishes to GitHub Pages automatically on changes to `docs/`.
:::
