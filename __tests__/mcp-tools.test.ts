/**
 * @jest-environment node
 */
import { findTool, tools } from '../mcp/src/tools';
import { renderOutput, type ToolOutput } from '../mcp/src/tools/types';

const env = { ACOLYTE_APP_URL: 'https://acolyte.example.com' };

// Run a tool the way the server does: validate input, then invoke the handler.
async function run(name: string, input: unknown): Promise<ToolOutput> {
  const tool = findTool(name);
  if (!tool) throw new Error(`Unknown tool ${name}`);
  const args = tool.inputSchema.parse(input);
  return tool.handler(args, env);
}

const json = async (name: string, input: unknown) => {
  const output = await run(name, input);
  return JSON.parse(renderOutput(output));
};

describe('MCP tool registry', () => {
  it('exposes unique, snake_case tool names', () => {
    const names = tools.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^[a-z][a-z0-9_]+$/);
  });

  it('gives every tool a title, description and object schema', () => {
    for (const tool of tools) {
      expect(tool.title).toBeTruthy();
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.inputSchema.safeParse({}).success).toBeDefined();
    }
  });
});

describe('catalog tools', () => {
  it('lists Acolyte pages with absolute links', async () => {
    const result = await json('list_acolyte_tools', {});
    expect(result.count).toBeGreaterThan(15);
    const jwt = result.tools.find((t: { url: string }) => t.url === '/jwt');
    expect(jwt.link).toBe('https://acolyte.example.com/jwt');
  });

  it('filters by category and finds by keyword', async () => {
    const analysis = await json('list_acolyte_tools', { category: 'Analysis' });
    expect(
      analysis.tools.every(
        (t: { category: string }) => t.category === 'Analysis',
      ),
    ).toBe(true);

    const found = await json('find_acolyte_tool', { query: 'wcag' });
    expect(found.tools.map((t: { title: string }) => t.title)).toEqual([
      'Accessibility Checker',
    ]);
  });
});

describe('utility tools', () => {
  it('formats, minifies and validates JSON', async () => {
    expect(
      renderOutput(await run('format_json', { json: '{"a":[1,2]}' })),
    ).toBe('{\n  "a": [\n    1,\n    2\n  ]\n}');
    expect(
      renderOutput(await run('minify_json', { json: '{ "a" : 1 }' })),
    ).toBe('{"a":1}');
    expect(await json('validate_json', { json: '[1]' })).toEqual({
      valid: true,
      type: 'array',
    });
    expect((await json('validate_json', { json: '{nope' })).valid).toBe(false);
  });

  it('round-trips Unicode through Base64', async () => {
    const encoded = renderOutput(
      await run('encode_base64', { text: 'Acolyte ⚡' }),
    );
    expect(encoded).toBe('QWNvbHl0ZSDimqE=');
    expect(renderOutput(await run('decode_base64', { base64: encoded }))).toBe(
      'Acolyte ⚡',
    );
  });

  it('decodes a JWT and reports expiry', async () => {
    const b64 = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString('base64url');
    const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
      sub: '42',
      exp: 1000,
    })}.sig`;
    const result = await json('decode_jwt', { token });
    expect(result.payload.sub).toBe('42');
    expect(result.expired).toBe(true);
    expect(result.timestamps.expiresAt).toBe('1970-01-01T00:16:40.000Z');
    expect(result.signatureValid).toBeUndefined();
  });

  it('converts colors and tests regular expressions', async () => {
    expect(
      renderOutput(await run('convert_color', { color: '#3b82f6' })),
    ).toContain('RGB: 59, 130, 246');

    const regex = await json('test_regex', {
      pattern: '(\\d+)',
      text: 'a1 b22',
    });
    expect(regex.count).toBe(2);
    expect(regex.matches[1]).toEqual({ match: '22', index: 4, groups: ['22'] });
  });

  it('generates passwords honouring presets and overrides', async () => {
    const pin = await json('generate_password', { preset: 'pin' });
    expect(pin.passwords[0]).toMatch(/^\d{6}$/);

    const custom = await json('generate_password', {
      length: 32,
      count: 3,
      symbols: false,
    });
    expect(custom.passwords).toHaveLength(3);
    for (const password of custom.passwords) {
      expect(password).toMatch(/^[A-Za-z0-9]{32}$/);
    }
    expect(custom.strength).toBe('Very Strong');
  });

  it('rejects impossible password options', async () => {
    await expect(
      run('generate_password', {
        lowercase: false,
        uppercase: false,
        numbers: false,
        symbols: false,
      }),
    ).rejects.toThrow('Enable at least one character class.');
  });
});

describe('analysis tools', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('summarizes a package.json without hitting the network', async () => {
    const result = await json('analyze_package_json', {
      packageJson: JSON.stringify({
        dependencies: { react: '^19.0.0', zod: '4.0.0' },
        devDependencies: { jest: '^30.0.0', react: '^19.0.0' },
      }),
    });
    expect(result.totalPackages).toBe(4);
    expect(result.productionPackages).toBe(2);
    expect(result.duplicates).toEqual(['react']);
    expect(result.vulnerabilities).toBeUndefined();
  });

  it('parses an inline OpenAPI spec in YAML', async () => {
    const result = await json('inspect_openapi', {
      spec: [
        'openapi: 3.0.0',
        'info: { title: Pets, version: 2.0.0 }',
        'paths:',
        '  /pets/{id}:',
        '    get:',
        '      summary: Fetch a pet',
        '      security: [{ apiKey: [] }]',
      ].join('\n'),
    });
    expect(result.title).toBe('Pets');
    expect(result.endpoints).toEqual([
      expect.objectContaining({
        method: 'GET',
        path: '/pets/{id}',
        parameters: ['id* (path)'],
        auth: 'apiKey',
      }),
    ]);
  });

  it('summarizes an SPDX SBOM', async () => {
    const result = await json('summarize_sbom', {
      includePackages: false,
      sbom: JSON.stringify({
        spdxVersion: 'SPDX-2.3',
        name: 'demo',
        packages: [
          { SPDXID: 'a', name: 'left-pad', licenseConcluded: 'MIT' },
          { SPDXID: 'b', name: 'mystery' },
        ],
      }),
    });
    expect(result.metadata.name).toBe('demo');
    expect(result.statistics).toEqual({
      totalPackages: 2,
      licensedPackages: 1,
      packagesWithSupplier: 0,
      uniqueLicenses: 1,
    });
    expect(result.packages).toBeUndefined();
  });

  it('analyzes a website from the fetched HTML', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        '<html><head><title>Hi</title><meta name="description" content="d"></head><body><a href="/">x</a><script src="/_next/a.js"></script></body></html>',
        {
          status: 200,
          headers: {
            'content-type': 'text/html',
            'x-frame-options': 'DENY',
          },
        },
      ),
    ) as typeof fetch;

    const result = await json('analyze_website', {
      url: 'https://example.com/page',
    });
    expect(result.content.title).toBe('Hi');
    expect(result.content.linkCount).toBe(1);
    expect(result.frameworks.nextjs).toBe(true);
    expect(result.securityHeaders['x-frame-options']).toBe('DENY');
  });

  it('reports the missing browser binding for accessibility checks', async () => {
    await expect(
      run('check_accessibility', { url: 'https://example.com' }),
    ).rejects.toThrow(/Browser Rendering is unavailable/);
  });
});

describe('API testing tools', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('performs an HTTP request and parses JSON bodies', async () => {
    const mock = jest.fn().mockResolvedValue(
      new Response('{"ok":true}', {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    global.fetch = mock as typeof fetch;

    const result = await json('http_request', {
      url: 'https://api.example.com/things',
      method: 'POST',
      body: { name: 'x' },
    });
    expect(result.status).toBe(201);
    expect(result.data).toEqual({ ok: true });

    const [, init] = mock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"name":"x"}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('collects Server-Sent Events up to the requested count', async () => {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('event: tick\ndata: 1\n\n'));
        controller.enqueue(
          encoder.encode('id: 7\ndata: two\ndata: lines\n\n: comment\n\n'),
        );
        controller.enqueue(encoder.encode('data: never\n\n'));
        controller.close();
      },
    });
    global.fetch = jest.fn().mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    ) as typeof fetch;

    const result = await json('read_sse', {
      url: 'https://example.com/events',
      maxEvents: 2,
    });
    expect(result.eventCount).toBe(2);
    expect(result.events).toEqual([
      { event: 'tick', data: '1' },
      { event: 'message', data: 'two\nlines', id: '7' },
    ]);
    expect(result.timedOut).toBe(false);
  });

  it('rejects non-WebSocket URLs before connecting', () => {
    const tool = findTool('websocket_send');
    expect(
      tool?.inputSchema.safeParse({ url: 'https://example.com' }).success,
    ).toBe(false);
    expect(
      tool?.inputSchema.safeParse({ url: 'wss://example.com/socket' }).success,
    ).toBe(true);
  });
});
