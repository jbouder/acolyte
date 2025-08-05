import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import Page from '../app/page';

// Mock fetch for this test suite only
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        ip: '127.0.0.1',
        city: 'Test City',
        region: 'Test Region',
        country_name: 'Test Country',
        org: 'Test ISP',
        timezone: 'UTC',
      }),
  }),
) as jest.Mock;

// Suppress act() warnings for async state updates in useEffect
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes(
        'An update to Home inside a test was not wrapped in act',
      ) ||
        args[0].includes('When testing, code that causes React state updates'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe('Page', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders a heading', () => {
    render(<Page />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Web Tools');
  });

  it('renders IP info after loading', async () => {
    render(<Page />);

    // Wait for the async fetch to complete and state to update
    await waitFor(
      () => {
        expect(
          screen.getByText((content, element) => {
            return element?.textContent === 'IP Address: 127.0.0.1';
          }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Check that mocked data is displayed
    expect(
      screen.getByText((content, element) => {
        return element?.textContent === 'Location: Test City, Test Country';
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText((content, element) => {
        return element?.textContent === 'ISP: Test ISP';
      }),
    ).toBeInTheDocument();

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith('https://ipapi.co/json/');
  });
});
