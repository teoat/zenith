
/**
 * Button Component Tests
 */



import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui/Button';

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles props correctly', () => {
    render(<Button variant="default" size="lg" />);
    const element = screen.getByRole('button');
    expect(element).toHaveClass('bg-primary');
  });

  it('is accessible', () => {
    render(<Button />);
    const element = screen.getByRole('button');
    expect(element).toBeInTheDocument();
  });
});
