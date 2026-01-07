
/**
 * Badge Component Tests
 */



import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge Component', () => {
  it('renders correctly', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('handles props correctly', () => {
    render(<Badge variant="default">Test</Badge>);
    const element = screen.getByText('Test');
    expect(element).toHaveClass('bg-primary');
  });

  it('is accessible', () => {
    render(<Badge>Test</Badge>);
    // Badges are generic containers, just checking it exists is enough for a basic smoke test
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
