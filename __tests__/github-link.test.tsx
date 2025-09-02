import { GitHubLink } from '@/components/github-link';
import { render, screen } from '@testing-library/react';

describe('GitHubLink', () => {
  it('renders a link to GitHub repository', () => {
    render(<GitHubLink />);

    const link = screen.getByRole('link', {
      name: /view source code on github/i,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/jbouder/acolyte');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has proper accessibility attributes', () => {
    render(<GitHubLink />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'View source code on GitHub');

    const srText = screen.getByText('View source on GitHub');
    expect(srText).toHaveClass('sr-only');
  });

  it('renders GitHub icon', () => {
    render(<GitHubLink />);

    // The Github icon from lucide-react should be present
    const icon = screen.getByRole('link').querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
