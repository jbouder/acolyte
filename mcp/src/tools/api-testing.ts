import { z } from 'zod';
import { parseHttpUrl } from '@/lib/server/errors';
import { performHttpRequest } from '@/lib/server/http-request';
import { defineTool } from './types';

const headersSchema = z
  .record(z.string(), z.string())
  .optional()
  .describe('Request headers as an object.');

export const httpRequest = defineTool({
  name: 'http_request',
  title: 'HTTP request',
  description:
    'Send an HTTP request from the Worker and return the status, headers, timing and body (parsed when JSON). Mirrors the APIs tool.',
  inputSchema: z.object({
    url: z.string().url().describe('Absolute http(s) URL.'),
    method: z
      .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
      .default('GET'),
    headers: headersSchema,
    body: z
      .union([z.string(), z.record(z.string(), z.unknown())])
      .optional()
      .describe('Request body for POST/PUT/PATCH. Objects are sent as JSON.'),
  }),
  annotations: { openWorldHint: true },
  handler: async ({ url, method, headers, body }) => ({
    json: await performHttpRequest({ url, method, headers, body }),
  }),
});

interface SseEvent {
  event: string;
  data: string;
  id?: string;
}

// Minimal text/event-stream parser: fields accumulate until a blank line.
function parseSseBlock(block: string): SseEvent | null {
  const event: SseEvent = { event: 'message', data: '' };
  const dataLines: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
    if (field === 'data') dataLines.push(value);
    else if (field === 'event') event.event = value;
    else if (field === 'id') event.id = value;
  }
  if (dataLines.length === 0) return null;
  event.data = dataLines.join('\n');
  return event;
}

export const sseRead = defineTool({
  name: 'read_sse',
  title: 'Read Server-Sent Events',
  description:
    'Connect to a Server-Sent Events endpoint and collect events until a maximum count or a timeout is reached. Mirrors the SSE tool.',
  inputSchema: z.object({
    url: z.string().url().describe('Absolute http(s) URL of the event stream.'),
    method: z.enum(['GET', 'POST']).default('GET'),
    headers: headersSchema,
    body: z
      .union([z.string(), z.record(z.string(), z.unknown())])
      .optional()
      .describe('Request body for POST streams. Objects are sent as JSON.'),
    maxEvents: z.number().int().min(1).max(200).default(10),
    timeoutMs: z.number().int().min(500).max(25000).default(5000),
  }),
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ url, method, headers, body, maxEvents, timeoutMs }) => {
    const target = parseHttpUrl(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const events: SseEvent[] = [];
    const started = Date.now();
    let status = 0;
    let statusText = '';
    let timedOut = false;
    let complete = false;

    try {
      const requestHeaders: Record<string, string> = {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Acolyte-MCP/0.1',
        ...headers,
      };
      const init: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };
      if (method === 'POST' && body !== undefined) {
        init.body = typeof body === 'string' ? body : JSON.stringify(body);
        if (
          !requestHeaders['Content-Type'] &&
          !requestHeaders['content-type']
        ) {
          requestHeaders['Content-Type'] = 'application/json';
        }
      }

      const response = await fetch(target.toString(), init);
      status = response.status;
      statusText = response.statusText;
      if (!response.ok || !response.body) {
        throw new Error(`SSE endpoint responded ${status} ${statusText}`);
      }

      // Decode bytes incrementally and split on blank lines, which delimit
      // events. Once enough events are in hand the fetch is aborted, which is
      // the cleanest way to let go of a still-open stream.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (!complete) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let separator = buffer.search(/\r?\n\r?\n/);
        while (separator !== -1) {
          const block = buffer.slice(0, separator);
          buffer = buffer.slice(separator).replace(/^\r?\n\r?\n/, '');
          const event = parseSseBlock(block);
          if (event) events.push(event);
          if (events.length >= maxEvents) {
            complete = true;
            break;
          }
          separator = buffer.search(/\r?\n\r?\n/);
        }
      }
      if (complete) controller.abort();
    } catch (error) {
      if (!controller.signal.aborted) throw error;
      timedOut = !complete;
    } finally {
      clearTimeout(timer);
    }

    return {
      json: {
        url: target.toString(),
        status,
        statusText,
        durationMs: Date.now() - started,
        timedOut,
        eventCount: events.length,
        events,
      },
    };
  },
});

export const websocketSend = defineTool({
  name: 'websocket_send',
  title: 'WebSocket exchange',
  description:
    'Open a WebSocket connection, optionally send messages, and collect what the server sends back until a message limit or timeout is reached. Mirrors the WebSockets tool.',
  inputSchema: z.object({
    url: z
      .string()
      .regex(/^wss?:\/\//, 'Use a ws:// or wss:// URL.')
      .describe('WebSocket URL.'),
    messages: z
      .array(z.string())
      .default([])
      .describe('Text messages to send, in order, once connected.'),
    maxMessages: z.number().int().min(0).max(200).default(10),
    timeoutMs: z.number().int().min(500).max(25000).default(5000),
  }),
  annotations: { openWorldHint: true },
  handler: async ({ url, messages, maxMessages, timeoutMs }) => {
    const started = Date.now();
    const received: Array<{ data: string; at: number }> = [];
    let closeCode: number | undefined;
    let closeReason = '';
    let timedOut = false;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const socket = new WebSocket(url);
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          if (socket.readyState === WebSocket.OPEN) socket.close(1000, 'done');
        } catch {}
        error ? reject(error) : resolve();
      };
      const timer = setTimeout(() => {
        timedOut = true;
        finish();
      }, timeoutMs);

      socket.addEventListener('open', () => {
        for (const message of messages) socket.send(message);
        if (maxMessages === 0) finish();
      });
      socket.addEventListener('message', (event) => {
        received.push({
          data: typeof event.data === 'string' ? event.data : '[binary]',
          at: Date.now() - started,
        });
        if (received.length >= maxMessages) finish();
      });
      socket.addEventListener('close', (event) => {
        closeCode = event.code;
        closeReason = event.reason;
        finish();
      });
      socket.addEventListener('error', () => {
        finish(new Error(`WebSocket connection to ${url} failed`));
      });
    });

    return {
      json: {
        url,
        sent: messages.length,
        received,
        durationMs: Date.now() - started,
        timedOut,
        closeCode,
        closeReason,
      },
    };
  },
});

export const apiTestingTools = [httpRequest, sseRead, websocketSend];
