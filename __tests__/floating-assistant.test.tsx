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
});
