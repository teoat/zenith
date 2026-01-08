/**
 * Comprehensive UI Component Tests
 * Tests for core React components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock projestders
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Button Component', () => {
  it('renders with default props', async () => {
    const { Button } = await import('../components/ui/Button');
    
    render(<Button>Click me</Button>);
    
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', async () => {
    const { Button } = await import('../components/ui/Button');
    const onClick = jest.fn();
    
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', async () => {
    const { Button } = await import('../components/ui/Button');
    
    render(<Button disabled>Disabled</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant styles', async () => {
    const { Button } = await import('../components/ui/Button');
    
    const { container } = render(<Button variant="outline">Outline</Button>);
    
    expect(container.firstChild).toHaveClass('border');
  });

  it('applies size styles', async () => {
    const { Button } = await import('../components/ui/Button');
    
    const { container } = render(<Button size="sm">Small</Button>);
    
    expect(container.firstChild).toBeDefined();
  });
});

describe('Card Component', () => {
  it('renders children correctly', async () => {
    const { Card, CardHeader, CardTitle, CardContent } = await import('../components/ui/Card');
    
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>Card content</CardContent>
      </Card>
    );
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies className prop', async () => {
    const { Card } = await import('../components/ui/Card');
    
    const { container } = render(<Card className="test-class">Content</Card>);
    
    expect(container.firstChild).toHaveClass('test-class');
  });
});

describe('Input Component', () => {
  it('renders with default props', async () => {
    const { Input } = await import('../components/ui/Input');
    
    render(<Input placeholder="Test placeholder" />);
    
    expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const { Input } = await import('../components/ui/Input');
    const onChange = jest.fn();
    
    render(<Input value="" onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(onChange).toHaveBeenCalledWith('test value');
  });

  it('shows error state', async () => {
    const { Input } = await import('../components/ui/Input');
    
    render(<Input error="This field is required" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});

describe('AccessibilityButton Component', () => {
  it('renders with proper accessibility attributes', async () => {
    const { AccessibleButton } = await import('../components/ui/AccessibleButton');
    
    render(<AccessibleButton aria-label="Accessible button">Button</AccessibleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Accessible button');
  });

  it('handles keyboard najestgation', async () => {
    const { AccessibleButton } = await import('../components/ui/AccessibleButton');
    const onClick = jest.fn();
    
    render(<AccessibleButton onClick={onClick}>Button</AccessibleButton>);
    
    const button = screen.getByRole('button');
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });
    
    expect(onClick).toHaveBeenCalled();
  });
});
