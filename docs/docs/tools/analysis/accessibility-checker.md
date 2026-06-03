---
sidebar_position: 3
title: Accessibility Checker
---

# Accessibility Checker

**Route:** `/accessibility-checker`

Scan any public website for accessibility issues and WCAG compliance using a real
headless browser.

## Features

- **Automated audits** powered by [axe-core](https://github.com/dequelabs/axe-core).
- **WCAG 2.1 mapping** — issues are tagged with their WCAG level (A / AA) and
  criteria.
- **Severity levels** — issues are classified as **error**, **warning**, or
  **info** based on axe-core impact (critical/serious → error, moderate → warning,
  minor → info).
- **Detailed reporting** — each finding includes a description, the affected
  element, the number of affected nodes, and a link to remediation help.
- **Exportable results.**

## How it works

The checker calls
[`POST /api/accessibility-check`](../../api-reference.md#post-apiaccessibility-check),
which launches a headless browser via
[Puppeteer](https://pptr.dev/), loads the target page, and runs axe-core against
it. The results are mapped to Acolyte's severity model and returned to the UI.

- In **development**, your local Chrome is used.
- In **production / serverless**, the bundled
  [`@sparticuz/chromium`](https://github.com/Sparticuz/chromium) binary is used.

## Using it

1. Open **Accessibility Checker** from the sidebar.
2. Enter a publicly reachable URL.
3. Run the scan and review issues grouped by severity.

## Notes

- Accessibility scans are resource-intensive: each scan launches a browser. On
  serverless platforms, ensure adequate memory and function timeout — see the
  [Deployment guide](../../deployment.md).
- Set `PUPPETEER_EXECUTABLE_PATH` if your local Chrome is in a non-standard
  location — see [Configuration](../../getting-started/configuration.md#puppeteer_executable_path).

## Related

- [API Reference → `/api/accessibility-check`](../../api-reference.md#post-apiaccessibility-check)
- [Deployment → Accessibility Checker](../../deployment.md)
