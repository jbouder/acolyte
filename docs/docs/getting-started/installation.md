---
sidebar_position: 1
title: Installation
---

# Installation

Acolyte is a [Next.js](https://nextjs.org/) application. You can run it locally in
a few minutes.

## Prerequisites

- **Node.js** 20.x or higher
- **npm** (bundled with Node.js)

Check your versions:

```bash
node --version
npm --version
```

## Install and run

1. **Clone the repository**

   ```bash
   git clone https://github.com/jbouder/acolyte.git
   cd acolyte
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   The dev server runs with [Turbopack](https://turbo.build/pack) for fast
   refresh.

4. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000).

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server (Turbopack). |
| `npm run build` | Create an optimized production build. |
| `npm start` | Serve the production build. |
| `npm test` | Run the Jest test suite. |
| `npm run lint` | Lint with Biome and auto-fix. |
| `npm run lint:ci` | Lint without writing changes (CI mode). |
| `npm run format` | Format code with Biome. |
| `npm run check` | Run Biome's combined lint + format check (auto-fix). |
| `npm run check:ci` | Combined check without writing changes (CI mode). |

## Building for production

```bash
npm run build
npm start
```

The production server listens on port `3000` by default. For deploying to Vercel
or other serverless platforms, see the [Deployment guide](../deployment.md).

## Next steps

- Most tools work out of the box. A few (the [Chat](../tools/api-testing/chat.md)
  tool, the [Accessibility Checker](../tools/analysis/accessibility-checker.md))
  have optional setup — see [Configuration](./configuration.md).
- Curious how it's put together? Read the
  [Architecture overview](../architecture.md).
