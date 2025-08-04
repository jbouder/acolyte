import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method, headers, requestBody } = body;

    // Validate required fields
    if (!url || !method) {
      return NextResponse.json(
        { error: 'URL and method are required' },
        { status: 400 },
      );
    }

    // Parse headers if provided
    let parsedHeaders: Record<string, string> = {};
    if (headers) {
      try {
        // Handle both object and string formats
        if (typeof headers === 'string') {
          headers.split('\n').forEach((line: string) => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
              parsedHeaders[key.trim()] = valueParts.join(':').trim();
            }
          });
        } else {
          parsedHeaders = headers;
        }
      } catch (error) {
        console.warn('Failed to parse headers:', error);
      }
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'Web-Tools-Basic',
        ...parsedHeaders,
      },
    };

    // Add body for methods that support it
    if (
      ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) &&
      requestBody
    ) {
      fetchOptions.body =
        typeof requestBody === 'string'
          ? requestBody
          : JSON.stringify(requestBody);

      // Set content-type if not already set
      if (!parsedHeaders['Content-Type'] && !parsedHeaders['content-type']) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Content-Type': 'application/json',
        };
      }
    }

    const startTime = Date.now();

    // Make the actual request
    const response = await fetch(url, fetchOptions);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Get response data
    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType?.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
    } else {
      responseData = await response.text();
    }

    // Get response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
      responseTime,
      contentLength:
        response.headers.get('content-length') ||
        responseData.toString().length,
    });
  } catch (error) {
    console.error('Basic API request failed:', error);

    return NextResponse.json(
      {
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 0,
        responseTime: 0,
      },
      { status: 500 },
    );
  }
}
