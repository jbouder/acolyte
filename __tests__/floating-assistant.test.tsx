import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FloatingAssistant } from '../components/floating-assistant';

const mockCreateMLCEngine = jest.fn();

jest.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: mockCreateMLCEngine,
}));

describe('FloatingAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'gpu', {
      configurable: true,
      value: {},
    });
  });

  it('starts loading the local model when opened', async () => {
    mockCreateMLCEngine.mockResolvedValueOnce({
      chat: { completions: { create: jest.fn() } },
    });

    render(<FloatingAssistant />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Open Acolyte assistant' }),
    );

    await waitFor(() => {
      expect(mockCreateMLCEngine).toHaveBeenCalledWith(
        'Qwen3-0.6B-q4f16_1-MLC',
        expect.objectContaining({
          initProgressCallback: expect.any(Function),
        }),
      );
    });
  });

  it('displays model startup errors without crashing', async () => {
    mockCreateMLCEngine.mockRejectedValueOnce(new Error('Model unavailable'));

    render(<FloatingAssistant />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Open Acolyte assistant' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to start the local assistant: Model unavailable',
    );
  });

  async function sendPrompt(content: string) {
    mockCreateMLCEngine.mockResolvedValueOnce({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content } }],
          }),
        },
      },
    });

    render(<FloatingAssistant />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Open Acolyte assistant' }),
    );

    // Wait for the initial engine load to settle so the send handler is not
    // short-circuited by the loading guard.
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Send message' }),
      ).not.toBeDisabled();
    });

    fireEvent.change(
      screen.getByRole('textbox', { name: 'Ask the assistant' }),
      {
        target: { value: 'hello' },
      },
    );
    fireEvent.submit(
      screen.getByRole('textbox', { name: 'Ask the assistant' }),
    );
  }

  it('parses JSON wrapped in think tags and code fences', async () => {
    await sendPrompt(
      '<think>deciding</think>```json\n{"reply":"Hi there"}\n```',
    );

    expect(await screen.findByText('Hi there')).toBeInTheDocument();
    expect(
      screen.queryByText(/Unable to start the local assistant/),
    ).not.toBeInTheDocument();
  });

  it('falls back to plain prose when the model does not return JSON', async () => {
    await sendPrompt('Acolyte has several tools you can use.');

    expect(
      await screen.findByText('Acolyte has several tools you can use.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/is not valid JSON/)).not.toBeInTheDocument();
  });
});
