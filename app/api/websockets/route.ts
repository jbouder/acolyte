import { NextRequest, NextResponse } from 'next/server';
import { WebSocket } from 'ws';

// Store active WebSocket connections
const connections = new Map<string, WebSocket>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const externalUrl = searchParams.get('url');
  const protocols = searchParams.get('protocols');
  const sessionId = searchParams.get('sessionId');

  if (!externalUrl) {
    return new Response("Missing 'url' parameter", { status: 400 });
  }

  if (!sessionId) {
    return new Response("Missing 'sessionId' parameter", { status: 400 });
  }

  try {
    // Validate the WebSocket URL
    const wsUrl = new URL(externalUrl);
    if (!['ws:', 'wss:'].includes(wsUrl.protocol)) {
      return new Response('Invalid WebSocket URL protocol', { status: 400 });
    }
  } catch {
    return new Response('Invalid WebSocket URL format', { status: 400 });
  }

  try {
    // Parse protocols if provided
    const protocolList = protocols 
      ? protocols.split(',').map(p => p.trim()).filter(p => p)
      : undefined;

    // Create WebSocket connection to external server
    const ws = new WebSocket(externalUrl, protocolList);
    connections.set(sessionId, ws);

    // Create a ReadableStream that forwards WebSocket messages
    const stream = new ReadableStream({
      start(controller) {
        // Send connection status
        const sendEvent = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        };

        ws.onopen = () => {
          sendEvent('connection', {
            type: 'connection',
            content: 'WebSocket connection opened',
            timestamp: new Date().toISOString()
          });
        };

        ws.onmessage = (event) => {
          sendEvent('message', {
            type: 'received',
            content: event.data,
            timestamp: new Date().toISOString()
          });
        };

        ws.onclose = (event) => {
          const reason = event.wasClean
            ? `Connection closed cleanly (Code: ${event.code})`
            : `Connection lost unexpectedly (Code: ${event.code})`;
          
          sendEvent('connection', {
            type: 'connection',
            content: reason,
            timestamp: new Date().toISOString()
          });
          
          connections.delete(sessionId);
          controller.close();
        };

        ws.onerror = (error) => {
          sendEvent('error', {
            type: 'error',
            content: 'WebSocket error occurred',
            timestamp: new Date().toISOString()
          });
          console.error('WebSocket proxy error:', error);
        };

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, 'Client disconnected');
          }
          connections.delete(sessionId);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('WebSocket proxy error:', error);
    return new Response(`Failed to connect to WebSocket: ${error}`, {
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, action } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const ws = connections.get(sessionId);
    if (!ws) {
      return NextResponse.json(
        { error: 'No active WebSocket connection found for this session' },
        { status: 404 }
      );
    }

    if (action === 'disconnect') {
      ws.close(1000, 'Manual disconnect');
      connections.delete(sessionId);
      return NextResponse.json({ success: true });
    }

    if (action === 'send') {
      if (!message) {
        return NextResponse.json(
          { error: 'Message is required for send action' },
          { status: 400 }
        );
      }

      if (ws.readyState !== WebSocket.OPEN) {
        return NextResponse.json(
          { error: 'WebSocket is not connected' },
          { status: 400 }
        );
      }

      ws.send(message);
      return NextResponse.json({ success: true });
    }

    if (action === 'ping') {
      if (ws.readyState !== WebSocket.OPEN) {
        return NextResponse.json(
          { error: 'WebSocket is not connected' },
          { status: 400 }
        );
      }

      ws.send('ping');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "send", "ping", or "disconnect"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('WebSocket proxy POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}