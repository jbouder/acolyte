import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const externalUrl = searchParams.get("url");

  if (!externalUrl) {
    return new Response("Missing 'url' parameter", { status: 400 });
  }

  try {
    // Validate the URL
    new URL(externalUrl);
  } catch {
    return new Response("Invalid URL format", { status: 400 });
  }

  try {
    // Fetch from the external SSE endpoint
    const response = await fetch(externalUrl, {
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      signal: request.signal,
    });

    if (!response.ok) {
      return new Response(
        `Failed to connect to external SSE: ${response.status} ${response.statusText}`,
        {
          status: response.status,
        }
      );
    }

    if (!response.body) {
      return new Response("No response body from external SSE", {
        status: 500,
      });
    }

    // Create a new ReadableStream that forwards the external SSE data
    const stream = new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader();

        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                controller.close();
                break;
              }

              // Forward the data as-is (preserving SSE format)
              controller.enqueue(value);
            }
          } catch (error) {
            console.error("SSE proxy error:", error);
            controller.error(error);
          }
        };

        pump();

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          reader.cancel();
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("SSE proxy error:", error);
    return new Response(`Failed to connect to external SSE: ${error}`, {
      status: 500,
    });
  }
}
