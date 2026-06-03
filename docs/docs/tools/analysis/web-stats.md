---
sidebar_position: 1
title: Web Stats
---

# Web Stats

**Route:** `/web-stats`

Fetch a URL and report basic statistics about the response and the requesting web
client.

## Features

- **Response timing** — how long the target took to respond.
- **Content size** — the size of the returned document.
- **Response metadata** — status and headers returned by the target.
- **Client details** — information about your browser and environment.

## How it works

The tool calls [`POST /api/web-stats`](../../api-reference.md#post-apiweb-stats),
which fetches the target URL server-side (with a timeout) and measures the
response. Fetching server-side avoids CORS restrictions that would block a direct
browser request.

## Using it

1. Open **Web Stats** from the sidebar.
2. Enter a URL.
3. Review the timing, size, and response details.

## Related

- [Website Analysis](./website-analysis.md) — deeper structural and SEO analysis.
- [API Reference → `/api/web-stats`](../../api-reference.md#post-apiweb-stats)
