import { NextRequest } from 'next/server';

async function handleSSERequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const externalUrl = searchParams.get('url');
  const method = searchParams.get('method') || 'GET';

  if (!externalUrl) {
    return new Response("Missing 'url' parameter", { status: 400 });
  }

  try {
    // Validate the URL
    new URL(externalUrl);
  } catch {
    return new Response('Invalid URL format', { status: 400 });
  }

  // Parse custom headers and body from request
  let customHeaders: Record<string, string> = {};
  let requestBody: string | undefined;

  if (request.method === 'POST') {
    try {
      const payload = await request.json();
      customHeaders = payload.headers || {};
      requestBody = payload.body ? JSON.stringify(payload.body) : undefined;
    } catch (error) {
      console.error('Failed to parse request payload:', error);
    }
  }

  try {
    // Build headers for the external request
    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...customHeaders,
    };

    // Fetch from the external SSE endpoint
    const fetchOptions: RequestInit = {
      method: method,
      headers,
      signal: request.signal,
    };

    // Add body for POST requests
    if (method === 'POST' && requestBody) {
      fetchOptions.body = requestBody;
      // Ensure Content-Type is set if not provided
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(externalUrl, fetchOptions);

    if (!response.ok) {
      return new Response(
        `Failed to connect to external SSE: ${response.status} ${response.statusText}`,
        {
          status: response.status,
        },
      );
    }

    if (!response.body) {
      return new Response('No response body from external SSE', {
        status: 500,
      });
    }

    // Create a new ReadableStream that forwards the external SSE data
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader();
        console.log('[SSE Proxy] Starting stream pump');

        const pump = async () => {
          try {
            let chunkCount = 0;
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                console.log(
                  `[SSE Proxy] Stream ended after ${chunkCount} chunks`,
                );
                controller.close();
                break;
              }

              chunkCount++;
              console.log(
                `[SSE Proxy] Forwarding chunk ${chunkCount} (${value.length} bytes)`,
              );
              // Forward the data as-is (preserving SSE format)
              controller.enqueue(value);
            }
          } catch (error) {
            console.error('[SSE Proxy] Stream error:', error);
            controller.error(error);
          }
        };

        pump();

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          console.log('[SSE Proxy] Client disconnected, canceling stream');
          reader.cancel();
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
      },
    });
  } catch (error) {
    console.error('SSE proxy error:', error);
    return new Response(`Failed to connect to external SSE: ${error}`, {
      status: 500,
    });
  }
}

export async function GET(request: NextRequest) {
  return handleSSERequest(request);
}

export async function POST(request: NextRequest) {
  return handleSSERequest(request);
}
