import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
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
    const { baseElement } = render(<Page />);

    expect(baseElement).toBeInTheDocument();
  });
});
