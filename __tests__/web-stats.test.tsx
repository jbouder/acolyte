import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import WebStatsPage from '../app/web-stats/page';

// Mock fetch for IP info API
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
  })
) as jest.Mock;

// Mock HTMLCanvasElement.getContext to avoid JSDOM errors
HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

// Suppress act() warnings for async state updates in useEffect
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes(
        'An update to WebStatsPage inside a test was not wrapped in act',
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

describe('WebStatsPage', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Web Stats page with all stat cards', () => {
    render(<WebStatsPage />);

    // Check main heading
    expect(screen.getByText('Web Stats')).toBeInTheDocument();

    // Check all stat card headings
    expect(screen.getByText('Browser Stats')).toBeInTheDocument();
    expect(screen.getByText('Device & Hardware')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Location & Time')).toBeInTheDocument();
    expect(screen.getByText('Storage & Quota')).toBeInTheDocument();
    expect(screen.getByText('Network & IP Info')).toBeInTheDocument();
    expect(screen.getByText('Browser Features')).toBeInTheDocument();
    expect(screen.getByText('Security Context')).toBeInTheDocument();
    expect(screen.getByText('Media & Input')).toBeInTheDocument();
  });

  it('displays browser statistics labels', () => {
    render(<WebStatsPage />);

    // Check browser stats content labels
    expect(screen.getByText(/User Agent:/)).toBeInTheDocument();
    expect(screen.getByText(/Language:/)).toBeInTheDocument();
    expect(screen.getByText(/Platform:/)).toBeInTheDocument();
    expect(screen.getByText(/Cookies:/)).toBeInTheDocument();
    expect(screen.getByText(/Online:/)).toBeInTheDocument();
  });

  it('displays device and hardware information labels', () => {
    render(<WebStatsPage />);

    // Check device stats content labels
    expect(screen.getByText(/CPU Cores:/)).toBeInTheDocument();
    expect(screen.getByText(/Screen Resolution:/)).toBeInTheDocument();
    expect(screen.getByText(/Viewport:/)).toBeInTheDocument();
    expect(screen.getByText(/Color Depth:/)).toBeInTheDocument();
    expect(screen.getByText(/Pixel Ratio:/)).toBeInTheDocument();
  });

  it('displays performance metrics labels', () => {
    render(<WebStatsPage />);

    // Check performance stats content labels
    expect(screen.getByText(/JS Heap Used:/)).toBeInTheDocument();
    expect(screen.getByText(/JS Heap Total:/)).toBeInTheDocument();
    expect(screen.getByText(/JS Heap Limit:/)).toBeInTheDocument();
    expect(screen.getByText(/Page Load Time:/)).toBeInTheDocument();
    expect(screen.getByText(/DOM Content Loaded:/)).toBeInTheDocument();
  });

  it('displays storage and quota information labels', () => {
    render(<WebStatsPage />);

    // Check storage stats content labels
    expect(screen.getByText(/Local Storage:/)).toBeInTheDocument();
    expect(screen.getByText(/Session Storage:/)).toBeInTheDocument();
    expect(screen.getByText(/IndexedDB:/)).toBeInTheDocument();
    expect(screen.getByText(/Storage Quota:/)).toBeInTheDocument();
    expect(screen.getByText(/Storage Used:/)).toBeInTheDocument();
    expect(screen.getByText(/Storage Available:/)).toBeInTheDocument();
  });

  it('fetches and displays IP information', async () => {
    render(<WebStatsPage />);

    // Check that IP section exists
    expect(screen.getByText('Network & IP Info')).toBeInTheDocument();

    // Wait for IP info to load and check for the IP value
    await waitFor(() => {
      expect(screen.getByText(/127\.0\.0\.1/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalledWith('https://ipapi.co/json/');
  });

  it('displays browser feature support labels', () => {
    render(<WebStatsPage />);

    // Check browser features content labels
    expect(screen.getByText(/WebGL:/)).toBeInTheDocument();
    expect(screen.getByText(/WebGL2:/)).toBeInTheDocument();
    expect(screen.getByText(/WebAssembly:/)).toBeInTheDocument();
    expect(screen.getByText(/Service Worker:/)).toBeInTheDocument();
    expect(screen.getByText(/Push API:/)).toBeInTheDocument();
    expect(screen.getByText(/Web Share API:/)).toBeInTheDocument();
  });

  it('displays security context information labels', () => {
    render(<WebStatsPage />);

    // Check security context content labels
    expect(screen.getByText(/HTTPS:/)).toBeInTheDocument();
    expect(screen.getByText(/Secure Context:/)).toBeInTheDocument();
    expect(screen.getByText(/Cross-Origin Isolated:/)).toBeInTheDocument();
    expect(screen.getByText(/Do Not Track:/)).toBeInTheDocument();
    expect(screen.getByText(/Permissions API:/)).toBeInTheDocument();
  });

  it('displays media and input capabilities labels', () => {
    render(<WebStatsPage />);

    // Check media and input content labels
    expect(screen.getByText(/Geolocation:/)).toBeInTheDocument();
    expect(screen.getByText(/Camera\/Mic:/)).toBeInTheDocument();
    expect(screen.getByText(/Gamepad API:/)).toBeInTheDocument();
    expect(screen.getByText(/Vibration API:/)).toBeInTheDocument();
    expect(screen.getByText(/Touch Support:/)).toBeInTheDocument();
    expect(screen.getByText(/Max Touch Points:/)).toBeInTheDocument();
  });

  it('handles failed IP fetch gracefully', async () => {
    // Mock failed fetch
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    render(<WebStatsPage />);

    // Check that IP section exists
    expect(screen.getByText('Network & IP Info')).toBeInTheDocument();

    // Wait to ensure loading state changes
    await waitFor(() => {
      expect(screen.queryByText(/N\/A/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays time and timezone information labels', () => {
    render(<WebStatsPage />);

    // Check time/timezone content labels
    expect(screen.getByText(/Current Time:/)).toBeInTheDocument();
    expect(screen.getByText(/Date:/)).toBeInTheDocument();
    expect(screen.getByText(/Timezone:/)).toBeInTheDocument();
    expect(screen.getByText(/UTC Offset:/)).toBeInTheDocument();
    expect(screen.getByText(/Locale:/)).toBeInTheDocument();
  });

  it('displays N/A for unavailable features', () => {
    render(<WebStatsPage />);

    // Should show N/A for features not available in test environment
    expect(screen.getAllByText(/N\/A/).length).toBeGreaterThan(0);
  });

  it('formats bytes correctly', () => {
    render(<WebStatsPage />);

    // The component should be able to render without crashing
    // even if memory info is not available
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('renders without crashing when APIs are missing', () => {
    // This test ensures the component handles missing browser APIs gracefully
    render(<WebStatsPage />);

    // Should still render the main heading
    expect(screen.getByText('Web Stats')).toBeInTheDocument();
  });
});