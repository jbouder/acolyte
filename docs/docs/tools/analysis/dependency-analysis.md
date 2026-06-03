---
sidebar_position: 4
title: Dependency Analysis
---

# Dependency Analysis

**Route:** `/dependency-analysis`

Paste a `package.json` and get insight into your project's dependencies —
vulnerabilities, counts, and a dependency tree.

## Features

- **Package categorization & counts** — dependencies vs. devDependencies, totals.
- **Vulnerability scanning** via the [OSV.dev](https://osv.dev/) database.
- **Dependency tree** built from npm registry metadata (depth-limited to keep
  results manageable).
- **Outdated/insight reporting** for your declared dependencies.

## How it works

The tool uses two server-side route handlers:

- [`POST /api/vulnerability-check`](../../api-reference.md#post-apivulnerability-check)
  — queries OSV.dev for known vulnerabilities affecting your packages.
- [`POST /api/dependency-tree`](../../api-reference.md#post-apidependency-tree)
  — fetches package metadata from the npm registry and builds a tree (limited to a
  maximum depth to avoid huge or circular graphs).

## Using it

1. Open **Dependency Analysis** from the sidebar.
2. Paste the contents of your `package.json`.
3. Run the analysis to see counts, vulnerabilities, and the dependency tree.

## Related

- [SBOM Report](./sbom-report.md) — analyze an SPDX Software Bill of Materials.
- [API Reference → `/api/vulnerability-check`](../../api-reference.md#post-apivulnerability-check)
- [API Reference → `/api/dependency-tree`](../../api-reference.md#post-apidependency-tree)
