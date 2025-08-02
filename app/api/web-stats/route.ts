import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Fetch the webpage
    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Web-Tools-Stats/1.0",
      },
      // Set a reasonable timeout
      signal: AbortSignal.timeout(10000),
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Get response body
    const html = await response.text();
    const contentLength = new Blob([html]).size;

    // Parse HTML to extract metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "No title found";

    const descriptionMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    const description = descriptionMatch
      ? descriptionMatch[1]
      : "No description found";

    // Count various elements
    const linkCount = (html.match(/<a[^>]*href/gi) || []).length;
    const imageCount = (html.match(/<img[^>]*src/gi) || []).length;
    const scriptCount = (html.match(/<script[^>]*>/gi) || []).length;
    const styleCount = (html.match(/<style[^>]*>/gi) || []).length;
    const cssLinkCount = (
      html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []
    ).length;

    // Extract meta tags
    const metaTags = [];
    const metaMatches = html.matchAll(/<meta[^>]*>/gi);
    for (const match of metaMatches) {
      const metaTag = match[0];
      const nameMatch = metaTag.match(/name=["']([^"']+)["']/i);
      const propertyMatch = metaTag.match(/property=["']([^"']+)["']/i);
      const contentMatch = metaTag.match(/content=["']([^"']+)["']/i);

      if ((nameMatch || propertyMatch) && contentMatch) {
        metaTags.push({
          name: nameMatch?.[1] || propertyMatch?.[1] || "",
          content: contentMatch[1],
        });
      }
    }

    // Get headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Calculate some additional metrics
    const wordCount = html
      .replace(/<[^>]*>/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const charCount = html.length;
    const htmlSizeKB = (contentLength / 1024).toFixed(2);

    // Check for common frameworks/libraries
    const hasJQuery = html.includes("jquery") || html.includes("jQuery");
    const hasReact = html.includes("react") || html.includes("React");
    const hasVue = html.includes("vue") || html.includes("Vue");
    const hasAngular = html.includes("angular") || html.includes("Angular");
    const hasBootstrap =
      html.includes("bootstrap") || html.includes("Bootstrap");

    // Security headers check
    const securityHeaders = {
      "x-frame-options": headers["x-frame-options"] || null,
      "x-content-type-options": headers["x-content-type-options"] || null,
      "x-xss-protection": headers["x-xss-protection"] || null,
      "strict-transport-security": headers["strict-transport-security"] || null,
      "content-security-policy": headers["content-security-policy"] || null,
    };

    const stats = {
      url: targetUrl.toString(),
      domain: targetUrl.hostname,
      protocol: targetUrl.protocol,
      statusCode: response.status,
      statusText: response.statusText,
      responseTime,
      timestamp: new Date().toISOString(),

      // Content analysis
      content: {
        title,
        description,
        contentLength,
        htmlSizeKB: parseFloat(htmlSizeKB),
        wordCount,
        charCount,
        linkCount,
        imageCount,
        scriptCount,
        styleCount,
        cssLinkCount,
      },

      // Technical details
      headers,
      securityHeaders,

      // Framework detection
      frameworks: {
        jquery: hasJQuery,
        react: hasReact,
        vue: hasVue,
        angular: hasAngular,
        bootstrap: hasBootstrap,
      },

      // Meta tags (limit to first 20 to avoid huge responses)
      metaTags: metaTags.slice(0, 20),

      // Performance metrics
      performance: {
        responseTimeMs: responseTime,
        contentLengthBytes: contentLength,
        compressionRatio: headers["content-encoding"]
          ? "Compressed"
          : "Not compressed",
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Web stats error:", error);

    if (error instanceof Error) {
      if (error.name === "TimeoutError" || error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Request timeout - the website took too long to respond" },
          { status: 408 }
        );
      }
      if (error.message.includes("fetch")) {
        return NextResponse.json(
          {
            error:
              "Failed to fetch the website. It may be down or blocking requests.",
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to analyze website" },
      { status: 500 }
    );
  }
}
