---
sidebar_position: 2
title: Configuration
---

# Configuration

Acolyte requires **no configuration to run** — `npm run dev` is enough, and the
vast majority of tools operate entirely client-side. A few features have optional
environment variables, described below.

## Environment variables

Acolyte reads environment variables from `.env` files (which are git-ignored).
Create a `.env.local` in the project root to set values for local development.

### `PUPPETEER_EXECUTABLE_PATH`

Used by the [Accessibility Checker](../tools/analysis/accessibility-checker.md),
which drives a headless browser via Puppeteer.

- In **development**, Acolyte uses your local Chrome installation.
- In **production / serverless**, it uses the bundled
  [`@sparticuz/chromium`](https://github.com/Sparticuz/chromium) binary.

Set this variable only if Chrome is installed in a non-standard location:

```bash
# .env.local
PUPPETEER_EXECUTABLE_PATH=/path/to/your/chrome
```

Common paths:

| OS | Path |
| --- | --- |
| macOS | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| Linux | `/usr/bin/google-chrome` |
| Windows | `C:\Program Files\Google\Chrome\Application\chrome.exe` |

See the [Deployment guide](../deployment.md) for serverless specifics.

## The Chat tool and local model providers

The [Chat](../tools/api-testing/chat.md) tool talks to **OpenAI v1-compatible**
model providers. For local providers, Acolyte proxies requests to default
localhost ports so the browser isn't blocked by CORS:

| Provider | Default endpoint |
| --- | --- |
| llama.cpp | `http://localhost:8080/v1/chat/completions` |
| Ollama | `http://localhost:11434/v1/chat/completions` |
| Docker Model Runner | `http://localhost:12434/engines/v1/chat/completions` |

There is no API key stored on the server. Credentials you enter are forwarded
only as the `Authorization` header for the request you initiate. See the
[Chat tool docs](../tools/api-testing/chat.md) for details.

## Persistent data

Acolyte stores your data **in the browser**, never on a server:

- **IndexedDB** — API testing projects, saved chat conversations, notepad
  content.
- **localStorage** — UI preferences such as the theme (light/dark).

Clearing your browser storage resets this data. Nothing is synced or uploaded.
