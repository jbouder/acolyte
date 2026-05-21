import { POST } from '../app/api/genai/chat/completions/route';

const mockFetch = jest.fn();

describe('GenAI chat completion proxy route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
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

    const request = new Request(
      'http://localhost/api/genai/chat/completions',
      {
        method: 'POST',
        body: JSON.stringify({
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
        }),
      },
    );

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
    const request = new Request(
      'http://localhost/api/genai/chat/completions',
      {
        method: 'POST',
        body: JSON.stringify({
          url: 'file:///etc/passwd',
          body: {},
        }),
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Provider URL must use HTTP or HTTPS',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
