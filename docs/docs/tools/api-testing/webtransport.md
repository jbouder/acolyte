---
sidebar_position: 4
title: WebTransport
---

# WebTransport Testing

**Route:** `/webtransport`

Experiment with [WebTransport](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport),
a modern transport protocol built on HTTP/3 and QUIC that supports low-latency
streams and unreliable datagrams.

:::note
WebTransport is reachable directly at `/webtransport`. It relies on the browser's
native `WebTransport` API, which is available in recent Chromium-based browsers
and may not be supported everywhere.
:::

## Features

- **Connect to a WebTransport endpoint** and manage the session.
- **Streams and datagrams** — send and receive both message types.
- **Connection statistics** — streams created, datagrams sent/received, RTT,
  bandwidth usage, packet loss, congestion window, and active streams.
- **Message log** distinguishing stream, datagram, system, and error messages.

## How it works

The session is established **directly from your browser** via the native
`WebTransport` API. Your server must speak HTTP/3 and present a valid certificate
that the browser accepts.

## Using it

1. Open `/webtransport`.
2. Enter the URL of a WebTransport server.
3. Connect and choose whether to exchange **streams** or **datagrams**.
4. Watch the live statistics and message log update.

## Related

- [WebSockets](./websockets.md) — widely supported bidirectional alternative.
