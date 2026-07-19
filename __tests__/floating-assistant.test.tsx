import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FloatingAssistant } from '../components/floating-assistant';

const mockCreateMLCEngine = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: mockCreateMLCEngine,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

// Control the device class directly; jsdom does not implement
// window.matchMedia, which the real hook relies on.
let mockIsMobile = false;
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockIsMobile,
}));

describe('FloatingAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsMobile = false;
    Object.defineProperty(navigator, 'gpu', {
      configurable: true,
      value: {},
    });
  });

  it('loads the desktop model when opened on a desktop', async () => {
    mockCreateMLCEngine.mockResolvedValueOnce({
      chat: { completions: { create: jest.fn() } },
    });

    render(<FloatingAssistant />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Open Acolyte assistant' }),
    );

    await waitFor(() => {
      expect(mockCreateMLCEngine).toHaveBeenCalledWith(
        'Qwen3-1.7B-q4f16_1-MLC',
        expect.objectContaining({
          initProgressCallback: expect.any(Function),
        }),
      );
    });
  });

  it('loads the lighter model when opened on a mobile device', async () => {
    mockIsMobile = true;
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

  async function sendPrompt(content: string, userInput = 'hello') {
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
        target: { value: userInput },
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

  it('navigates to a tool when asked to open one', async () => {
    // Detection short-circuits before the model, so the content is unused.
    await sendPrompt('unused', 'open the json formatter');

    expect(
      await screen.findByText('Opening JSON Formatter…'),
    ).toBeInTheDocument();
    expect(mockRouterPush).toHaveBeenCalledWith('/json-formatter');
  });

  it('clears the conversation when the clear button is clicked', async () => {
    await sendPrompt('{"reply":"Hi there"}');
    expect(await screen.findByText('Hi there')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear conversation' }));

    expect(screen.queryByText('Hi there')).not.toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
  });
});
