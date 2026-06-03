---
sidebar_position: 2
title: Server-Sent Events (SSE)
---

# Server-Sent Events (SSE)

**Route:** `/sse`

Test and monitor [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
streams — the one-way, server-to-client push protocol built on top of HTTP.

## Features

- **Connect to any SSE endpoint** and watch events arrive in real time.
- **Live event log** with timestamps and event data.
- **Connection status** indicator (connecting / open / closed / error).
- **Custom headers and request method** (GET or POST) for the upstream stream.

## How it works

The browser's native `EventSource` can't set custom headers and is blocked by
CORS for cross-origin endpoints, so Acolyte proxies the stream through its own
route handler: [`GET /api/sse`](../../api-reference.md#get-apisse) (and `POST` for
streams that require a request body). You provide the upstream endpoint via the
`url` parameter and Acolyte relays the `text/event-stream` back to the browser.

## Using it

1. Open **SSE** from the sidebar.
2. Enter the URL of an SSE endpoint.
3. Click **Connect**.
4. Watch events populate the log as they stream in.
5. Click **Disconnect** to close the connection.

## Related

- [REST APIs](./rest-apis.md) — for request/response HTTP.
- [WebSockets](./websockets.md) — when you need to send data back to the server.
- [API Reference → `/api/sse`](../../api-reference.md#get-apisse)
