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
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0.0.0 Safari/537.36',
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

  it('does not load the model on mobile browsers', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
    });

    render(<FloatingAssistant />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Open Acolyte assistant' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The local assistant is unavailable on mobile browsers to prevent device memory exhaustion.',
    );
    expect(mockCreateMLCEngine).not.toHaveBeenCalled();
  });
});
