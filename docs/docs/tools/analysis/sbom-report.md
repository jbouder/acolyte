---
sidebar_position: 5
title: SBOM Report
---

# SBOM Report

**Route:** `/sbom-report`

Analyze a Software Bill of Materials in **SPDX JSON** format and produce a
readable, organized report.

## Features

- **Document metadata** — SBOM name, SPDX version, creation info, and document
  details.
- **Package statistics** — total packages, distinct licenses, and suppliers.
- **Package list** — every component with its version and license.
- **Relationships** — dependency and containment relationships between packages.
- **Export** — download the report as JSON or plain text.

## How it works

The SBOM is parsed and analyzed **entirely in your browser** — nothing is
uploaded. You can paste the SPDX JSON directly or upload a file.

## Using it

1. Open **SBOM Report** from the sidebar.
2. Upload an SPDX JSON file or paste its contents.
3. Review the metadata, statistics, package list, and relationships.
4. Download the report in JSON or TXT format.

## Related

- [Dependency Analysis](./dependency-analysis.md) — analyze a `package.json`
  directly.
