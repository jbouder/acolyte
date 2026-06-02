import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ImageToolsPage from '@/app/image-tools/page';
import { searchableTools } from '@/lib/tools-data';

describe('ImageToolsPage', () => {
  const originalFileReader = global.FileReader;
  const originalImage = global.Image;

  afterEach(() => {
    global.FileReader = originalFileReader;
    global.Image = originalImage;
  });

  it('renders the core image adjustment controls', () => {
    render(<ImageToolsPage />);

    expect(
      screen.getByRole('heading', { name: 'Image Tools' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Choose Image' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Crop Width')).toBeInTheDocument();
    expect(screen.getByText('Output Format')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Download favicon.ico' }),
    ).toBeDisabled();
  });

  it('shows a crop overlay on the source preview', async () => {
    class MockFileReader {
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      onerror: (() => void) | null = null;

      readAsDataURL() {
        this.onload?.({
          target: { result: 'data:image/png;base64,test' },
        } as ProgressEvent<FileReader>);
      }
    }

    class MockImage {
      naturalWidth = 200;
      naturalHeight = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    global.FileReader = MockFileReader as typeof FileReader;
    global.Image = MockImage as typeof Image;

    const { container } = render(<ImageToolsPage />);
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(fileInput, {
      target: {
        files: [new File(['image'], 'sample.png', { type: 'image/png' })],
      },
    });

    await waitFor(() =>
      expect(screen.getByAltText('Selected preview')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText('Crop X'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByLabelText('Crop Y'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByLabelText('Crop Width'), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText('Crop Height'), {
      target: { value: '50' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('crop-preview-overlay')).toHaveStyle({
        left: '25%',
        top: '10%',
        width: '50%',
        height: '50%',
      });
    });
  });

  it('registers image tools in searchable tool metadata', () => {
    expect(searchableTools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Image Tools',
          url: '/image-tools',
          keywords: expect.arrayContaining(['image', 'crop', 'favicon']),
        }),
      ]),
    );
  });
});
