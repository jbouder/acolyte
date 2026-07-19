import {
  assistantActionNames,
  detectAssistantAction,
  executeAssistantAction,
  isAssistantAction,
} from '../lib/assistant-actions';

describe('assistant actions', () => {
  it('formats JSON text', () => {
    expect(
      executeAssistantAction({
        name: 'format_json',
        input: '{"tool":"acolyte"}',
      }),
    ).toBe('{\n  "tool": "acolyte"\n}');
  });

  it('reports invalid JSON without throwing', () => {
    expect(
      executeAssistantAction({ name: 'validate_json', input: '{invalid}' }),
    ).toMatch(/Unable to complete validate_json/);
  });

  it('encodes and decodes Unicode Base64 text', () => {
    const encoded = executeAssistantAction({
      name: 'encode_base64',
      input: 'Acolyte ⚡',
    });

    expect(
      executeAssistantAction({ name: 'decode_base64', input: encoded }),
    ).toBe('Acolyte ⚡');
  });

  it('generates a password of the requested length', () => {
    const result = executeAssistantAction({
      name: 'generate_password',
      input: '24',
    });

    expect(result).toHaveLength(24);
    expect(result).not.toMatch(/\s/);
  });

  it('defaults to a 20-character password when no length is given', () => {
    expect(
      executeAssistantAction({ name: 'generate_password', input: '' }),
    ).toHaveLength(20);
  });

  it('decodes a JWT into its header and payload', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    const result = executeAssistantAction({ name: 'decode_jwt', input: token });

    expect(result).toContain('"alg": "HS256"');
    expect(result).toContain('"name": "John Doe"');
  });

  it('reports an invalid JWT without throwing', () => {
    expect(
      executeAssistantAction({ name: 'decode_jwt', input: 'not-a-jwt' }),
    ).toMatch(/Unable to complete decode_jwt/);
  });

  it('finds Acolyte app tools by topic', () => {
    expect(
      executeAssistantAction({ name: 'find_tools', input: 'json' }),
    ).toContain('JSON Formatter');
  });

  it('lists what the assistant itself can do', () => {
    const result = executeAssistantAction({ name: 'list_tools', input: '' });

    expect(result).toContain('Decode a JSON Web Token');
    expect(result).toContain('Generate a strong, random password');
  });

  it('lists the tools available across the app', () => {
    expect(
      executeAssistantAction({ name: 'list_app_tools', input: '' }),
    ).toContain('JSON Formatter — Format and validate JSON data');
  });

  it('minifies JSON text', () => {
    expect(
      executeAssistantAction({
        name: 'minify_json',
        input: '{\n  "tool": "acolyte"\n}',
      }),
    ).toBe('{"tool":"acolyte"}');
  });

  it('converts a color between formats', () => {
    const result = executeAssistantAction({
      name: 'convert_color',
      input: '#3b82f6',
    });

    expect(result).toContain('HEX: #3b82f6');
    expect(result).toContain('RGB: 59, 130, 246');
    expect(result).toContain('HSL: 217, 91%, 60%');
  });

  it('reports an unparseable color without throwing', () => {
    expect(
      executeAssistantAction({ name: 'convert_color', input: 'not-a-color' }),
    ).toMatch(/Unable to complete convert_color/);
  });

  it('tests a regular expression and lists matches', () => {
    const result = executeAssistantAction({
      name: 'test_regex',
      input: JSON.stringify({ pattern: '\\d+', flags: 'g', text: 'a1 b22' }),
    });

    expect(result).toContain('2 matches');
    expect(result).toContain('"1" at index 1');
    expect(result).toContain('"22" at index 4');
  });

  it('reports no regex matches without throwing', () => {
    expect(
      executeAssistantAction({
        name: 'test_regex',
        input: JSON.stringify({ pattern: 'z', text: 'abc' }),
      }),
    ).toBe('No matches found.');
  });

  it('reports an invalid regex request without throwing', () => {
    expect(
      executeAssistantAction({ name: 'test_regex', input: 'not json' }),
    ).toMatch(/Unable to complete test_regex/);
  });

  it('resolves a tool to open by name', () => {
    expect(
      executeAssistantAction({
        name: 'open_tool',
        input: 'open the JWT decoder',
      }),
    ).toBe('Opening JWT Decoder…');
    expect(
      executeAssistantAction({ name: 'open_tool', input: 'open nonsense' }),
    ).toBe('No matching Acolyte tool was found.');
  });

  it('toggles the theme and saves the preference', () => {
    document.documentElement.classList.add('light');

    expect(executeAssistantAction({ name: 'toggle_theme', input: '' })).toBe(
      'Switched to dark mode.',
    );
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem('acolyte-theme')).toBe('dark');
  });

  describe('intent detection', () => {
    it('detects a pasted JWT anywhere in the message', () => {
      const token =
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.SflKxwRJSMeKKF2QT4fwpM';

      expect(detectAssistantAction(`is ${token} valid?`)).toEqual({
        name: 'decode_jwt',
        input: token,
      });
    });

    it('detects a Base64 decode request and isolates the payload', () => {
      expect(
        detectAssistantAction('please decode this base64: SGVsbG8gV29ybGQ='),
      ).toEqual({ name: 'decode_base64', input: 'SGVsbG8gV29ybGQ=' });
    });

    it('detects a password request with an explicit length', () => {
      expect(detectAssistantAction('generate a 32 character password')).toEqual(
        { name: 'generate_password', input: '32' },
      );
    });

    it('detects a password request without a length', () => {
      expect(detectAssistantAction('I need a secure password')).toEqual({
        name: 'generate_password',
        input: '',
      });
    });

    it('ignores open-ended questions so the model can answer', () => {
      expect(
        detectAssistantAction('what tools does the app have?'),
      ).toBeUndefined();
      // Mentions "password" but without a generate-style verb, so it should
      // fall through to the model rather than spitting out a new password.
      expect(
        detectAssistantAction('how do I reset the password on my router?'),
      ).toBeUndefined();
    });

    it('falls through when a Base64 request has no isolable payload', () => {
      expect(
        detectAssistantAction('can you decode base64 for me'),
      ).toBeUndefined();
    });

    it('detects a hex color when there is color context', () => {
      expect(detectAssistantAction('what is #3b82f6 in rgb?')).toEqual({
        name: 'convert_color',
        input: 'what is #3b82f6 in rgb?',
      });
    });

    it('detects a bare hex color on its own', () => {
      expect(detectAssistantAction('#3b82f6')).toEqual({
        name: 'convert_color',
        input: '#3b82f6',
      });
    });

    it('ignores an incidental hex-like token without color context', () => {
      expect(
        detectAssistantAction('fix the bug in commit #abc123'),
      ).toBeUndefined();
    });

    it('detects a minify request and isolates the JSON', () => {
      expect(
        detectAssistantAction('minify this { "a": 1, "b": [2, 3] } please'),
      ).toEqual({ name: 'minify_json', input: '{ "a": 1, "b": [2, 3] }' });
    });

    it('detects an open request that resolves to a real tool', () => {
      expect(detectAssistantAction('take me to the regex tester')).toEqual({
        name: 'open_tool',
        input: 'take me to the regex tester',
      });
    });

    it('ignores an open request that matches no tool', () => {
      expect(detectAssistantAction('open the pod bay doors')).toBeUndefined();
    });
  });

  it('accepts only allowlisted model actions', () => {
    expect(assistantActionNames).toContain('format_json');
    expect(
      isAssistantAction({ name: 'format_json', input: '{"tool":"acolyte"}' }),
    ).toBe(true);
    expect(isAssistantAction({ name: 'delete_all_data', input: '' })).toBe(
      false,
    );
    expect(isAssistantAction({ name: 'list_tools' })).toBe(false);
  });
});
