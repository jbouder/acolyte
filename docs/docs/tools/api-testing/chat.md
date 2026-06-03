---
sidebar_position: 5
title: Chat
---

# Chat

**Route:** `/chat`

A chat client for **OpenAI v1-compatible** model providers. Point it at a hosted
provider or a model running on your own machine.

## Supported providers

The Chat tool speaks the OpenAI `v1/chat/completions` API shape. Local providers
are proxied through Acolyte so the browser isn't blocked by CORS:

| Provider | Default endpoint |
| --- | --- |
| **llama.cpp** | `http://localhost:8080/v1/chat/completions` |
| **Ollama** | `http://localhost:11434/v1/chat/completions` |
| **Docker Model Runner** | `http://localhost:12434/engines/v1/chat/completions` |

Any other OpenAI-compatible endpoint can be used as well.

## Features

- **Multi-turn conversations** with streaming responses.
- **Saved conversations** persisted to IndexedDB.
- **Configurable provider and model.**
- **Bring your own key** — credentials are sent only as the request's
  `Authorization` header.

## How it works

Requests go to
[`POST /api/genai/chat/completions`](../../api-reference.md#post-apigenaichatcompletions),
which forwards them to the selected provider. The proxy forwards only the
`Authorization` and `Content-Type` headers — no credentials are stored on the
server.

## Using it

1. Run a local model server (e.g. `ollama serve`) or have a hosted endpoint
   ready.
2. Open **Chat** from the sidebar.
3. Select the provider and model; supply an API key if the provider needs one.
4. Start chatting. Conversations are saved locally so you can revisit them.

## Notes

- Local providers must be running and listening on their default ports (above)
  for the proxy to reach them.
- Saved conversations live in your browser only.

## Related

- [Configuration → Chat providers](../../getting-started/configuration.md#the-chat-tool-and-local-model-providers)
- [API Reference → `/api/genai/chat/completions`](../../api-reference.md#post-apigenaichatcompletions)
