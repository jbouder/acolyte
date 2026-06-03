---
sidebar_position: 8
title: Contributing
---

# Contributing

Contributions to Acolyte are welcome! This guide covers the workflow for both the
app and these docs.

## Workflow

1. **Fork** the repository on GitHub.
2. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and ensure tests pass.
4. **Run the quality checks**:

   ```bash
   npm test
   npm run check
   ```

5. **Commit** with clear, semantic messages.
6. **Push** to your fork and open a **Pull Request** against `main`.

CI runs the build, lint/format checks, and tests on every PR — see
[Development → Continuous integration](./development.md#continuous-integration).

## Guidelines

- Use **TypeScript** for all new code.
- Follow the existing style (enforced by [Biome](https://biomejs.dev/)).
- Write tests for new features and bug fixes.
- Use semantic commit messages.
- **Update documentation** when adding or changing features.

## Documentation

These docs are a [Docusaurus](https://docusaurus.io/) site living in the `docs/`
directory of the repository. They are published to **GitHub Pages** automatically.

### Editing the docs

```bash
cd docs
npm install
npm start
```

This starts a local dev server (default `http://localhost:3000`) with hot reload.

- Documentation pages are Markdown files under `docs/docs/`.
- The sidebar is generated from the folder structure and the `_category_.json`
  files; per-page order is controlled by the `sidebar_position` front matter.
- To add a page, drop a new `.md` file into the appropriate folder.

Build the static site locally to verify it compiles:

```bash
cd docs
npm run build
```

### How docs are deployed

A GitHub Actions workflow,
[`.github/workflows/docs.yml`](https://github.com/jbouder/acolyte/blob/main/.github/workflows/docs.yml),
handles documentation CI/CD:

- **On pull requests** that touch `docs/**`, it **builds** the site to catch
  errors early (no deploy).
- **On push to `main`** that touches `docs/**`, it builds and **deploys** to
  GitHub Pages.

The published site is served at **`https://jbouder.github.io/acolyte/`** (matching
the `url` + `baseUrl` in
[`docs/docusaurus.config.ts`](https://github.com/jbouder/acolyte/blob/main/docs/docusaurus.config.ts)).

:::note One-time setup
For deployment to work, enable GitHub Pages for the repository with
**Settings → Pages → Build and deployment → Source = GitHub Actions**.
:::

## Reporting issues

Found a bug or have a feature idea? Open an issue at
[github.com/jbouder/acolyte/issues](https://github.com/jbouder/acolyte/issues).
