---
sidebar_position: 3
title: Architecture
---

# Architecture

Acolyte is a single [Next.js](https://nextjs.org/) application using the **App
Router**. Each tool is a route under `app/`, sharing a common layout, sidebar, and
component library.

## Technology stack

### Frontend

- **[Next.js 16](https://nextjs.org/)** — React framework with the App Router,
  server components, and route handlers.
- **[React 19](https://react.dev/)** — UI library.
- **[TypeScript](https://www.typescriptlang.org/)** — static typing across the
  whole codebase.
- **[Tailwind CSS 4](https://tailwindcss.com/)** — utility-first styling.
- **[shadcn/ui](https://ui.shadcn.com/)** — accessible components built on
  [Radix UI](https://www.radix-ui.com/), with [Lucide](https://lucide.dev/) icons.
- **[next-themes](https://github.com/pacocoursey/next-themes)** — light/dark theme
  switching.

### Tooling

- **[Biome](https://biomejs.dev/)** — unified linter and formatter.
- **[Jest](https://jestjs.io/)** + **[React Testing Library](https://testing-library.com/)**
  — unit and integration tests.

### Storage & data

- **[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)**
  (via [`idb`](https://github.com/jakearchibald/idb)) — API testing projects,
  saved chats, and notepad content.
- **localStorage** — UI preferences.

## Project structure

```text
acolyte/
├── app/                       # Next.js App Router
│   ├── api/                   # Route handlers (server-side)
│   │   ├── basic/             # Proxy for REST API testing
│   │   ├── sse/               # Server-Sent Events demo endpoint
│   │   ├── web-stats/         # Fetch + measure a target URL
│   │   ├── website-analysis/  # (client-driven analysis helpers)
│   │   ├── vulnerability-check/   # OSV.dev vulnerability lookups
│   │   ├── dependency-tree/   # Build a dependency tree from npm metadata
│   │   ├── accessibility-check/   # Puppeteer + axe-core scans
│   │   └── genai/chat/completions # Proxy to OpenAI-compatible providers
│   ├── apis/                  # REST API testing UI
│   ├── sse/                   # SSE testing UI
│   ├── websockets/            # WebSocket testing UI
│   ├── webtransport/          # WebTransport testing UI
│   ├── chat/                  # GenAI chat UI
│   ├── web-stats/             # Web client stats UI
│   ├── website-analysis/      # Website analysis UI
│   ├── accessibility-checker/ # Accessibility scan UI
│   ├── dependency-analysis/   # Dependency analysis UI
│   ├── sbom-report/           # SBOM report UI
│   ├── markdown-preview/      # Markdown editor/preview
│   ├── mermaid-preview/       # Mermaid diagram editor
│   ├── swagger-viewer/        # OpenAPI/Swagger viewer
│   ├── base64/                # Base64 encode/decode
│   ├── json-formatter/        # JSON formatter
│   ├── regex/                 # Regex tester
│   ├── color-picker/          # Color picker
│   ├── image-tools/           # Image crop/resize/convert/favicon
│   ├── jwt/                   # JWT decoder
│   ├── password-generator/    # Password generator
│   ├── notepad/               # Developer notepad
│   ├── games/                 # Snake, Breakout, Sudoku
│   ├── layout.tsx             # Root layout (sidebar, theme provider)
│   ├── page.tsx               # Home / dashboard
│   └── globals.css            # Global styles & Tailwind layers
├── components/                # Shared React components
│   ├── ui/                    # shadcn/ui primitives
│   ├── app-sidebar.tsx        # Navigation sidebar
│   ├── api-request-form.tsx   # Reusable request form
│   ├── site-search.tsx        # Command palette / search
│   └── theme-*.tsx            # Theme provider and toggle
├── lib/                       # Utilities and client-side storage
│   ├── tools-data.ts          # Canonical tool registry (titles, routes, icons)
│   ├── api-projects-storage.ts
│   ├── genai-chat-storage.ts
│   ├── notepad-storage.ts
│   ├── jwt-utils.ts
│   └── utils.ts
├── hooks/                     # Custom React hooks
├── public/                    # Static assets
└── __tests__/                 # Test suites
```

## How tools are registered

The list of tools — their titles, routes, icons, categories, and search keywords —
lives in a single source of truth: [`lib/tools-data.ts`](https://github.com/jbouder/acolyte/blob/main/lib/tools-data.ts).
The sidebar and the command-palette search (`Cmd/Ctrl+K`) are both generated from
this registry, so adding a tool there wires it into navigation and search
automatically.

## Client vs. server

Most tools run **entirely in the browser**. The only server-side code is the set
of route handlers in `app/api/`, which exist to:

- **avoid CORS limitations** (e.g. proxying arbitrary REST requests),
- **reach services the browser can't** (npm registry, OSV.dev), or
- **run a headless browser** (accessibility scans via Puppeteer).

These are documented in the [API Reference](./api-reference.md).
