
/**
 * Card Component Tests
 */



import { render, screen } from '@testing-library/react';
import { Card, CardContent } from '@/components/ui/Card';

describe('Card Component', () => {
  it('renders correctly', () => {
    render(
      <Card>
        <CardContent>Test Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('handles className prop correctly', () => {
    render(<Card className="test-class">Content</Card>);
    // Card renders a div, we access it via text
    const element = screen.getByText('Content').closest('div');
    expect(element).toHaveClass('test-class');
  });
});
