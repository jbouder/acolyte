import { ToolError } from '@/lib/server/errors';

export interface HttpRequestInput {
  url: string;
  method: string;
  /** Either an object or "Header: value" lines. */
  headers?: Record<string, string> | string;
  body?: unknown;
}

export interface HttpRequestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  responseTime: number;
  contentLength: number | string;
}

// Accept headers as an object or as newline-separated "Key: value" text, the
// two shapes the APIs page can send.
export function parseHeaders(
  headers: HttpRequestInput['headers'],
): Record<string, string> {
  if (!headers) return {};
  if (typeof headers !== 'string') return { ...headers };
  const parsed: Record<string, string> = {};
  headers.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      parsed[key.trim()] = valueParts.join(':').trim();
    }
  });
  return parsed;
}

// Perform an HTTP request on behalf of the caller and describe the response,
// mirroring what the APIs page shows: status, headers, timing and a body that
// is parsed as JSON when the server says it is JSON.
export async function performHttpRequest(
  input: HttpRequestInput,
): Promise<HttpRequestResult> {
  const { url, method, headers, body } = input;
  if (!url || !method) {
    throw new ToolError('URL and method are required', 400);
  }

  const parsedHeaders = parseHeaders(headers);
  const upperMethod = method.toUpperCase();

  const fetchOptions: RequestInit = {
    method: upperMethod,
    headers: {
      'User-Agent': 'Acolyte-Basic',
      ...parsedHeaders,
    },
  };

  if (['POST', 'PUT', 'PATCH'].includes(upperMethod) && body) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);

    if (!parsedHeaders['Content-Type'] && !parsedHeaders['content-type']) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'application/json',
      };
    }
  }

  const startTime = Date.now();
  const response = await fetch(url, fetchOptions);
  const responseTime = Date.now() - startTime;

  const contentType = response.headers.get('content-type');
  let data: unknown;

  if (contentType?.includes('application/json')) {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  } else {
    data = await response.text();
  }

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    data,
    responseTime,
    contentLength:
      response.headers.get('content-length') ||
      (typeof data === 'string' ? data : JSON.stringify(data)).length,
  };
}
