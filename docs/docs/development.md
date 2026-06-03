---
sidebar_position: 7
title: Development
---

# Development

Conventions and tooling for working on Acolyte.

## Code quality

Acolyte uses **[Biome](https://biomejs.dev/)** as a single, fast tool for both
linting and formatting.

```bash
# Lint and auto-fix
npm run lint

# Lint only (CI mode — no writes)
npm run lint:ci

# Format
npm run format

# Format check (CI mode — no writes)
npm run format:ci

# Combined lint + format check with auto-fix
npm run check

# Combined check, no writes (CI mode)
npm run check:ci
```

The configuration lives in [`biome.json`](https://github.com/jbouder/acolyte/blob/main/biome.json).

## Testing

Tests use **[Jest](https://jestjs.io/)** with
**[React Testing Library](https://testing-library.com/)**. Test files live in
`__tests__/`.

```bash
# Run the full test suite
npm test
```

Aim to cover new components and utilities, and add regression tests for bug fixes.

## Continuous integration

Every push to `main` and every pull request runs the
[`Code Quality Checks`](https://github.com/jbouder/acolyte/blob/main/.github/workflows/code-quality.yml)
workflow, which:

1. **Builds** the app (`npm run build`).
2. **Checks** lint + formatting (`npm run check:ci`).
3. **Runs tests** (`npm test`).

A separate workflow builds and deploys this documentation site — see
[Contributing → Documentation](./contributing.md#documentation).

## Adding a new tool

Tools are registered in a single source of truth,
[`lib/tools-data.ts`](https://github.com/jbouder/acolyte/blob/main/lib/tools-data.ts).
A typical new tool involves:

1. **Create the route** under `app/<your-tool>/page.tsx`.
2. **Register it** in `lib/tools-data.ts` with a title, URL, icon, description,
   category, and search keywords. This wires it into the sidebar and the
   `Cmd/Ctrl+K` search automatically.
3. **(If it needs a server)** add a route handler under `app/api/`.
4. **Add tests** in `__tests__/`.
5. **Document it** under `docs/docs/tools/` so it shows up here.

See the [Architecture overview](./architecture.md) for how the pieces fit
together.

## Coding guidelines

- Use **TypeScript** for all new code.
- Follow the existing style — Biome enforces it; run `npm run check` before
  committing.
- Prefer the shared UI primitives in `components/ui/` and utilities in `lib/`.
- Keep tools client-side unless a server route is genuinely required (CORS,
  unreachable services, or a headless browser).
