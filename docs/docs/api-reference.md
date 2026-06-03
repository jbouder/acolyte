---
sidebar_position: 5
title: API Reference
---

# API Reference

Acolyte runs almost entirely in the browser, but a handful of **Next.js route
handlers** under `app/api/` provide server-side functionality — mainly to bypass
CORS, reach services the browser can't, or run a headless browser.

These endpoints back specific tools and are not intended as a stable public API;
they're documented here to explain how the tools work. All paths are relative to
your Acolyte deployment (e.g. `http://localhost:3000`).

| Endpoint | Method | Backs |
| --- | --- | --- |
| [`/api/basic`](#post-apibasic) | `POST` | [REST APIs](./tools/api-testing/rest-apis.md) |
| [`/api/sse`](#get-apisse) | `GET` / `POST` | [SSE](./tools/api-testing/sse.md) |
| [`/api/web-stats`](#post-apiweb-stats) | `POST` | [Web Stats](./tools/analysis/web-stats.md) |
| [`/api/vulnerability-check`](#post-apivulnerability-check) | `POST` | [Dependency Analysis](./tools/analysis/dependency-analysis.md) |
| [`/api/dependency-tree`](#post-apidependency-tree) | `POST` | [Dependency Analysis](./tools/analysis/dependency-analysis.md) |
| [`/api/accessibility-check`](#post-apiaccessibility-check) | `POST` | [Accessibility Checker](./tools/analysis/accessibility-checker.md) |
| [`/api/genai/chat/completions`](#post-apigenaichatcompletions) | `POST` | [Chat](./tools/api-testing/chat.md) |

---

## POST /api/basic

Proxies an arbitrary HTTP request to a target URL, returning the response. Used by
the REST API testing tool to sidestep browser CORS restrictions.

**Request body**

```json
{
  "url": "https://api.example.com/users",
  "method": "POST",
  "headers": { "Content-Type": "application/json" },
  "requestBody": "{ \"name\": \"Ada\" }"
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `url` | string | ✅ | Target URL to call. |
| `method` | string | ✅ | HTTP method (`GET`, `POST`, …). |
| `headers` | object \| string | — | Headers as an object, or newline-delimited `Key: Value` text. |
| `requestBody` | string | — | Request payload for non-GET methods. |

Returns the proxied response, including status, headers, and body. Responds with
`400` if `url` or `method` is missing.

---

## GET /api/sse

Proxies a [Server-Sent Events](./tools/api-testing/sse.md) stream from an upstream
endpoint, relaying `text/event-stream` data to the browser. A `POST` variant is
available for upstream streams that require a request body.

**Query parameters**

| Parameter | Required | Description |
| --- | --- | --- |
| `url` | ✅ | The upstream SSE endpoint to connect to. |
| `method` | — | Upstream method; defaults to `GET`. |

**POST body** (optional, for `method=POST` upstreams)

```json
{
  "headers": { "Authorization": "Bearer …" },
  "body": { "topic": "updates" }
}
```

Responds with `400` if `url` is missing or invalid.

---

## POST /api/web-stats

Fetches a target URL server-side and measures the response (timing and size).

**Request body**

```json
{ "url": "https://example.com" }
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `url` | string | ✅ | URL to fetch and measure. |

The request uses a timeout to avoid hanging on slow targets. Responds with `400`
for a missing or malformed URL.

---

## POST /api/vulnerability-check

Looks up known vulnerabilities for a set of packages via the
[OSV.dev](https://osv.dev/) database.

**Request body**

```json
{
  "packages": [
    { "name": "lodash", "version": "4.17.20" }
  ]
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `packages` | array | ✅ | Packages to check, each with a `name` and `version`. |

Responds with `400` if `packages` is missing or not an array.

---

## POST /api/dependency-tree

Builds a dependency tree from npm registry metadata for the given packages. Tree
depth is limited (default max depth of 3) to avoid huge or circular graphs, and
metadata is cached during the request.

**Request body**

```json
{
  "packages": [
    { "name": "express", "version": "4.18.2" }
  ]
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `packages` | array | ✅ | Root packages to expand into trees. |

Responds with `400` for invalid `packages` data.

---

## POST /api/accessibility-check

Runs an [axe-core](https://github.com/dequelabs/axe-core) accessibility audit
against a URL using a headless browser ([Puppeteer](https://pptr.dev/)).

**Request body**

```json
{
  "url": "https://example.com",
  "wcagLevel": "AA"
}
```

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `url` | string | ✅ | — | Page to audit. |
| `wcagLevel` | string | — | `"AA"` | Target WCAG conformance level. |

Findings are returned with severity (`error` / `warning` / `info`), the affected
element, WCAG level/criteria, and a help URL. Responds with `400` if `url` is
missing.

:::note
This endpoint launches a browser and is resource-intensive. In development it uses
your local Chrome; in production it uses the bundled `@sparticuz/chromium` binary.
See [Deployment](./deployment.md) for serverless requirements.
:::

---

## POST /api/genai/chat/completions

Proxies a chat completion request to an OpenAI v1-compatible provider. Used by the
[Chat](./tools/api-testing/chat.md) tool. Only the `Authorization` and
`Content-Type` headers are forwarded; no credentials are stored on the server.

**Request body**

```json
{
  "providerId": "ollama",
  "headers": { "Authorization": "Bearer …" },
  "body": {
    "model": "llama3",
    "messages": [{ "role": "user", "content": "Hello" }]
  }
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `providerId` | string | ✅ | One of `llama-cpp`, `ollama`, `docker-model-runner`. |
| `headers` | object | — | Headers to forward (only `Authorization` / `Content-Type` are passed through). |
| `body` | object | — | The OpenAI-style chat completion payload. |

Local provider endpoints:

| `providerId` | Forwarded to |
| --- | --- |
| `llama-cpp` | `http://localhost:8080/v1/chat/completions` |
| `ollama` | `http://localhost:11434/v1/chat/completions` |
| `docker-model-runner` | `http://localhost:12434/engines/v1/chat/completions` |

Responds with an error for an unsupported `providerId`.
