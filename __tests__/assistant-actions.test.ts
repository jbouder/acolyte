import {
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

  it('limits tool discovery to the action allowlist', () => {
    expect(
      executeAssistantAction({ name: 'find_tools', input: 'json' }),
    ).toContain('format_json');
  });

  it('lists available Acolyte tools', () => {
    expect(executeAssistantAction({ name: 'list_tools', input: '' })).toContain(
      'JSON Formatter: Format and validate JSON data',
    );
  });

  it('toggles the theme and saves the preference', () => {
    document.documentElement.classList.add('light');

    expect(executeAssistantAction({ name: 'toggle_theme', input: '' })).toBe(
      'Switched to dark mode.',
    );
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem('acolyte-theme')).toBe('dark');
  });

  it('accepts only allowlisted model actions', () => {
    expect(
      isAssistantAction({ name: 'format_json', input: '{"tool":"acolyte"}' }),
    ).toBe(true);
    expect(isAssistantAction({ name: 'delete_all_data', input: '' })).toBe(
      false,
    );
    expect(isAssistantAction({ name: 'list_tools' })).toBe(false);
  });
});
