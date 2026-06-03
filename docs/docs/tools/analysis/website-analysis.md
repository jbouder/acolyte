---
sidebar_position: 2
title: Website Analysis
---

# Website Analysis

**Route:** `/website-analysis`

In-depth analysis of a web page's structure, metadata, and best practices.

## Features

- **Security headers** — checks for headers like `Content-Security-Policy`,
  `Strict-Transport-Security`, `X-Frame-Options`, and more.
- **Metadata & SEO** — title, meta description, Open Graph tags, and other head
  metadata.
- **Structure** — headings, landmarks, and document outline.
- **Best practices** — common recommendations surfaced from the analysis.

## How it works

The tool retrieves the target page server-side (reusing Acolyte's fetch route
handlers to bypass CORS) and analyzes the returned HTML and headers in the
browser.

## Using it

1. Open **Website Analysis** from the sidebar.
2. Enter the URL of the site to analyze.
3. Review the categorized findings.

## Related

- [Web Stats](./web-stats.md) — quick timing and size metrics.
- [Accessibility Checker](./accessibility-checker.md) — WCAG compliance scanning.
