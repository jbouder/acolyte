import { NextRequest } from 'next/server';

interface ChatCompletionProxyRequest {
  url?: unknown;
  headers?: unknown;
  body?: unknown;
}

const FORWARDED_HEADER_NAMES = new Set(['authorization', 'content-type']);

function getForwardedHeaders(headers: unknown) {
  const forwardedHeaders: Record<string, string> = {};

  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return forwardedHeaders;
  }

  for (const [name, value] of Object.entries(headers)) {
    if (
      FORWARDED_HEADER_NAMES.has(name.toLowerCase()) &&
      typeof value === 'string'
    ) {
      forwardedHeaders[name] = value;
    }
  }

  return forwardedHeaders;
}

function parseTargetUrl(url: unknown) {
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('Provider URL is required');
  }

  const targetUrl = new URL(url);

  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    throw new Error('Provider URL must use HTTP or HTTPS');
  }

  if (targetUrl.username || targetUrl.password) {
    throw new Error('Provider URL must not include credentials');
  }

  return targetUrl;
}

export async function POST(request: NextRequest) {
  let payload: ChatCompletionProxyRequest;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const targetUrl = parseTargetUrl(payload.url);
    const headers = {
      'Content-Type': 'application/json',
      ...getForwardedHeaders(payload.headers),
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload.body ?? {}),
      signal: request.signal,
    });

    const responseText = await response.text();
    const contentType = response.headers.get('content-type');

    return new Response(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: contentType ? { 'Content-Type': contentType } : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to proxy chat request';

    return Response.json({ error: message }, { status: 400 });
  }
}
