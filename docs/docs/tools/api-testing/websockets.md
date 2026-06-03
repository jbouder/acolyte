---
sidebar_position: 3
title: WebSockets
---

# WebSocket Testing

**Route:** `/websockets`

Open a full-duplex [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
connection and exchange messages in both directions.

## Features

- **Connect to `ws://` and `wss://` endpoints.**
- **Send messages** and watch responses arrive in real time.
- **Message history** with direction (sent / received) and timestamps.
- **Connection status** monitoring (connecting / open / closing / closed).

## How it works

The WebSocket connection is made **directly from your browser** using the native
`WebSocket` API — no server proxy is involved. The remote server must allow the
connection (and, for `wss://`, present a valid TLS certificate).

## Using it

1. Open **WebSockets** from the sidebar.
2. Enter a WebSocket URL (`ws://localhost:8080` or `wss://example.com/socket`).
3. Click **Connect**.
4. Type a message and **Send**; replies appear in the history.
5. Click **Disconnect** to close the socket.

## Related

- [SSE](./sse.md) — for one-way server push.
- [WebTransport](./webtransport.md) — for modern, low-latency transport.
