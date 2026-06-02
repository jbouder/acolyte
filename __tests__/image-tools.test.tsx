import { render, screen } from '@testing-library/react';

import ImageToolsPage from '@/app/image-tools/page';
import { searchableTools } from '@/lib/tools-data';

describe('ImageToolsPage', () => {
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
