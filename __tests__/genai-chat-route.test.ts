import { POST } from '../app/api/genai/chat/completions/route';

const mockFetch = jest.fn();

class MockResponse {
  status: number;
  statusText: string;
  headers: Headers;
  private readonly body: string;

  constructor(body = '', init: ResponseInit = {}) {
    this.body = body;
    this.status = init.status ?? 200;
    this.statusText = init.statusText ?? '';
    this.headers = new Headers(init.headers);
  }

  static json(body: unknown, init: ResponseInit = {}) {
    return new MockResponse(JSON.stringify(body), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  }

  async text() {
    return this.body;
  }

  async json() {
    return JSON.parse(this.body);
  }
}

function createRequest(payload: unknown) {
  return {
    json: () => Promise.resolve(payload),
    signal: undefined,
  } as never;
}

describe('GenAI chat completion proxy route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
    global.Response = MockResponse as unknown as typeof Response;
  });

  it('forwards chat completion requests to the configured provider', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Hello from the provider' } }],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const request = createRequest({
      url: 'http://localhost:8080/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
        'X-Not-Forwarded': 'ignored',
      },
      body: {
        model: 'local-model',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: false,
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      choices: [{ message: { content: 'Hello from the provider' } }],
    });
    expect(mockFetch).toHaveBeenCalledWith(
      new URL('http://localhost:8080/v1/chat/completions'),
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
        },
        body: JSON.stringify({
          model: 'local-model',
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false,
        }),
      }),
    );
  });

  it('rejects invalid provider URLs', async () => {
    const request = createRequest({
      url: 'file:///etc/passwd',
      body: {},
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Provider URL must use HTTP or HTTPS',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
