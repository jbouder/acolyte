---
slug: /
sidebar_position: 1
title: Introduction
---

# Acolyte

**Acolyte** is a comprehensive web application designed to assist developers in
their day-to-day duties. Whether you're testing APIs, analyzing applications, or
reaching for an everyday development utility, Acolyte brings the tools you need
together in one fast, keyboard-friendly interface.

> Everything runs in your browser. Most tools never send your data anywhere — and
> the few that need a server (accessibility scans, dependency lookups, the API
> proxy) use Acolyte's own Next.js route handlers, documented in the
> [API Reference](./api-reference.md).

## What's inside

Acolyte groups its tools into four categories:

| Category | Tools |
| --- | --- |
| 🧪 **API Testing** | [REST APIs](./tools/api-testing/rest-apis.md), [SSE](./tools/api-testing/sse.md), [WebSockets](./tools/api-testing/websockets.md), [Chat](./tools/api-testing/chat.md) |
| 📊 **Analysis** | [Web Stats](./tools/analysis/web-stats.md), [Website Analysis](./tools/analysis/website-analysis.md), [Accessibility Checker](./tools/analysis/accessibility-checker.md), [Dependency Analysis](./tools/analysis/dependency-analysis.md), [SBOM Report](./tools/analysis/sbom-report.md) |
| 🔧 **Utilities** | [Markdown](./tools/utilities/markdown-preview.md), [Mermaid](./tools/utilities/mermaid-preview.md), [Swagger Viewer](./tools/utilities/swagger-viewer.md), [Base64](./tools/utilities/base64.md), [JSON Formatter](./tools/utilities/json-formatter.md), [Regex Tester](./tools/utilities/regex.md), [Color Picker](./tools/utilities/color-picker.md), [Image Tools](./tools/utilities/image-tools.md), [JWT Decoder](./tools/utilities/jwt.md), [Password Generator](./tools/utilities/password-generator.md), [Notepad](./tools/utilities/notepad.md) |
| 🎮 **Entertainment** | [Games](./tools/games.md) — Snake, Breakout, Sudoku |

## Quick links

- **New here?** Start with [Installation](./getting-started/installation.md) to run
  Acolyte locally.
- **Want to understand the codebase?** See the
  [Architecture overview](./architecture.md).
- **Deploying?** The [Deployment guide](./deployment.md) covers Vercel and other
  serverless platforms.
- **Contributing?** The [Contributing guide](./contributing.md) walks through the
  workflow and conventions.

## Technology at a glance

Acolyte is built on **Next.js 16** (App Router) and **React 19** with
**TypeScript**, styled with **Tailwind CSS 4** and **shadcn/ui** components.
Quality is enforced with **Biome** (lint + format) and **Jest** +
**React Testing Library** for tests. See [Architecture](./architecture.md) for the
full picture.

## License

Acolyte is licensed under the **Apache License 2.0**. See
[LICENSE.md](https://github.com/jbouder/acolyte/blob/main/LICENSE.md) for details.
