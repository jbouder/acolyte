import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import 'fake-indexeddb/auto';
import GenAIChatPage from '../app/genai-chat/page';
import { genAIChatStorage } from '../lib/genai-chat-storage';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockFetch = jest.fn();
let randomId = 0;

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => `message-${++randomId}`),
  },
});

describe('GenAIChatPage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    randomId = 0;
    window.localStorage.clear();
    await genAIChatStorage.deleteApiKey();
    global.fetch = mockFetch;
  });

  it('renders local provider presets and connection fields', () => {
    render(<GenAIChatPage />);

    expect(screen.getByText('GenAI Chat')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /llama.cpp/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ollama/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Docker Model Runner/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Custom \/ External/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Provider URL')).toHaveValue(
      'http://localhost:8080/v1',
    );
    expect(
      screen.getByPlaceholderText('Only stored when you opt in below'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Remember API key in local storage/i),
    ).not.toBeChecked();
  });

  it('updates URL and model when selecting a local provider', () => {
    render(<GenAIChatPage />);

    fireEvent.click(screen.getByRole('button', { name: /Ollama/i }));

    expect(screen.getByLabelText('Provider URL')).toHaveValue(
      'http://localhost:11434/v1',
    );
    expect(screen.getByLabelText('Model')).toHaveValue('llama3.2');
  });

  it('loads saved custom connection settings from local storage', async () => {
    window.localStorage.setItem(
      'acolyte:genai-chat-settings',
      JSON.stringify({
        selectedProvider: 'custom',
        baseUrl: 'https://example.test/v1',
        rememberApiKey: true,
        model: 'external-model',
        systemPrompt: 'Saved system prompt',
      }),
    );
    await genAIChatStorage.saveApiKey('saved-key');

    render(<GenAIChatPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Provider URL')).toHaveValue(
        'https://example.test/v1',
      );
      expect(
        screen.getByPlaceholderText('Only stored when you opt in below'),
      ).toHaveValue('saved-key');
    });
    expect(
      screen.getByLabelText(/Remember API key in local storage/i),
    ).toBeChecked();
    expect(screen.getByLabelText('Model')).toHaveValue('external-model');
    expect(screen.getByLabelText('System Prompt')).toHaveValue(
      'Saved system prompt',
    );
  });

  it('sends an OpenAI v1-compatible chat completion request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            choices: [{ message: { content: 'Hello from the model' } }],
          }),
        ),
    });
    render(<GenAIChatPage />);

    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Hello model' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Send$/i }));

    await waitFor(() => {
      expect(screen.getByText('Hello from the model')).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const [, requestInit] = mockFetch.mock.calls[0];
    const body = JSON.parse(requestInit.body);

    expect(body).toMatchObject({
      model: 'local-model',
      stream: false,
    });
    expect(body.messages).toEqual([
      {
        role: 'system',
        content: 'You are a helpful developer assistant.',
      },
      {
        role: 'user',
        content: 'Hello model',
      },
    ]);
  });
});
