---
sidebar_position: 1
title: REST APIs
---

# REST API Testing

**Route:** `/apis`

A full-featured client for exercising RESTful HTTP endpoints — think of it as a
lightweight, browser-based alternative to Postman or `curl`.

## Features

- **All common HTTP methods** — GET, POST, PUT, PATCH, DELETE, and more.
- **Custom headers** — add any request headers, entered as `Key: Value` lines or
  as JSON.
- **Request bodies** — send JSON or raw payloads with non-GET requests.
- **Multiple tabs** — keep several requests open side by side for different
  endpoints.
- **Response inspection** — status code, response headers, timing, and a
  syntax-highlighted body.
- **Saved projects** — persist collections of requests to IndexedDB and reload
  them later.

## How it works

To avoid the browser's CORS restrictions when calling arbitrary third-party
endpoints, requests are routed through Acolyte's own proxy at
[`POST /api/basic`](../../api-reference.md#post-apibasic). The proxy forwards your
method, headers, and body to the target URL and returns the response. This means
your browser never makes the cross-origin call directly.

## Using it

1. Open **APIs** from the sidebar.
2. Enter the target **URL** and pick an HTTP **method**.
3. (Optional) Add **headers** and a **request body**.
4. Click **Send** and inspect the response.
5. Save the request to a **project** to reuse it later.

## Notes

- Saved projects live in your browser (IndexedDB) and are never uploaded.
- Because requests pass through the server proxy, the target sees the request
  coming from the Acolyte server, not your browser.

## Related

- [SSE](./sse.md) — for one-way streaming endpoints.
- [WebSockets](./websockets.md) — for bidirectional connections.
- [API Reference → `/api/basic`](../../api-reference.md#post-apibasic)
