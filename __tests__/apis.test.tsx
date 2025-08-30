import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BasicAPIsPage from '../app/apis/page';

// Mock the API projects storage
jest.mock('../lib/api-projects-storage', () => ({
  apiProjectsStorage: {
    list: jest.fn(() => Promise.resolve([])),
    save: jest.fn(() => Promise.resolve()),
    load: jest.fn(() => Promise.resolve(null)),
    delete: jest.fn(() => Promise.resolve()),
    createProject: jest.fn((name, tabs, description) => ({
      id: 'test-project-id',
      name,
      description,
      tabs,
      savedAt: '2024-01-01T00:00:00.000Z',
      lastModified: '2024-01-01T00:00:00.000Z',
    })),
  },
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch for this test suite
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { message: 'test response' },
        responseTime: 100,
        contentLength: 50,
      }),
  }),
) as jest.Mock;

describe('BasicAPIsPage', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the APIs page with tabbed interface', () => {
    render(<BasicAPIsPage />);

    // Check main heading
    expect(screen.getByText('APIs')).toBeInTheDocument();

    // Check that first tab is present
    expect(screen.getByText('Request 1')).toBeInTheDocument();

    // Check that the Add Tab button is present
    expect(screen.getByText('Add Tab')).toBeInTheDocument();

    // Check that API Request form is rendered
    expect(screen.getByText('API Request')).toBeInTheDocument();
    expect(screen.getByText('HTTP Method')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://jsonplaceholder.typicode.com/posts'),
    ).toBeInTheDocument();
  });

  it('allows adding a new tab', () => {
    render(<BasicAPIsPage />);

    // Initially should have 1 tab
    expect(screen.getByText('Request 1')).toBeInTheDocument();
    expect(screen.queryByText('Request 2')).not.toBeInTheDocument();

    // Click Add Tab button
    const addTabButton = screen.getByText('Add Tab');
    fireEvent.click(addTabButton);

    // Should now have a second tab
    expect(screen.getByText('Request 1')).toBeInTheDocument();
    expect(screen.getByText('Request 2')).toBeInTheDocument();
  });

  it('allows removing tabs when more than one exists', () => {
    render(<BasicAPIsPage />);

    // Add a second tab
    const addTabButton = screen.getByText('Add Tab');
    fireEvent.click(addTabButton);

    // Verify both tabs exist
    expect(screen.getByText('Request 1')).toBeInTheDocument();
    expect(screen.getByText('Request 2')).toBeInTheDocument();

    // Since we have 2 tabs, the close buttons should be visible (look for close button by title)
    const closeButtons = screen.getAllByTitle('Close tab');
    expect(closeButtons.length).toBeGreaterThan(0);

    // Click the close button for Request 2 (should be the second one)
    fireEvent.click(closeButtons[1]);

    // Should now have only Request 1
    expect(screen.getByText('Request 1')).toBeInTheDocument();
    expect(screen.queryByText('Request 2')).not.toBeInTheDocument();

    // Close buttons should no longer be visible (since only 1 tab remains)
    expect(screen.queryByTitle('Close tab')).not.toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<BasicAPIsPage />);

    // Add a second tab
    const addTabButton = screen.getByText('Add Tab');
    fireEvent.click(addTabButton);

    // Click on Request 1 tab
    const request1Tab = screen.getByText('Request 1');
    fireEvent.click(request1Tab);

    // Verify the tab content is displayed (API Request form should be visible)
    expect(screen.getByText('API Request')).toBeInTheDocument();

    // Click on Request 2 tab
    const request2Tab = screen.getByText('Request 2');
    fireEvent.click(request2Tab);

    // Verify the tab content is still displayed (should show another instance of the form)
    expect(screen.getByText('API Request')).toBeInTheDocument();
  });

  it('preserves default form values for new tabs', () => {
    render(<BasicAPIsPage />);

    // Add a second tab
    const addTabButton = screen.getByText('Add Tab');
    fireEvent.click(addTabButton);

    // Click on Request 2 tab
    const request2Tab = screen.getByText('Request 2');
    fireEvent.click(request2Tab);

    // Verify default values are present
    expect(
      screen.getByDisplayValue('https://jsonplaceholder.typicode.com/posts'),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Content-Type: application/json'),
    ).toBeInTheDocument();
  });

  it('displays project management buttons', () => {
    render(<BasicAPIsPage />);

    // Check that Save Project button is present
    expect(screen.getByText('Save Project')).toBeInTheDocument();

    // Check that Load Project button is present
    expect(screen.getByText('Load Project')).toBeInTheDocument();
  });

  it('opens save project dialog when Save Project button is clicked', async () => {
    render(<BasicAPIsPage />);

    // Click Save Project button
    const saveButton = screen.getByText('Save Project');
    fireEvent.click(saveButton);

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Save API Project')).toBeInTheDocument();
    });

    // Check dialog content
    expect(screen.getByText('Project Name *')).toBeInTheDocument();
    expect(screen.getByText('Description (optional)')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Enter project name...'),
    ).toBeInTheDocument();
  });

  it('opens load project dialog when Load Project button is clicked', async () => {
    render(<BasicAPIsPage />);

    // Click Load Project button
    const loadButton = screen.getByText('Load Project');
    fireEvent.click(loadButton);

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Load API Project')).toBeInTheDocument();
    });

    // Check dialog content shows no saved projects message
    expect(
      screen.getByText(
        'No saved projects found. Save your current configuration as a project first.',
      ),
    ).toBeInTheDocument();
  });
});
