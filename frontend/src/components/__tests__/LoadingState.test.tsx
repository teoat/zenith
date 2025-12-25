import { render, screen } from '@testing-library/react';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  it('renders spinner by default', () => {
    render(<LoadingState />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });

  it('renders custom text', () => {
    render(<LoadingState text="Custom loading..." />);
    // Check for visible text (not screen reader text)
    const visibleText = screen.getByText('Custom loading...', { selector: 'p' });
    expect(visibleText).toBeInTheDocument();
  });

  it('renders context-aware text for page', () => {
    render(<LoadingState context="page" />);
    const visibleText = screen.getByText('Loading page...', { selector: 'p' });
    expect(visibleText).toBeInTheDocument();
  });

  it('renders context-aware text for data', () => {
    render(<LoadingState context="data" />);
    const visibleText = screen.getByText('Fetching data...', { selector: 'p' });
    expect(visibleText).toBeInTheDocument();
  });

  it('renders context-aware text for network', () => {
    render(<LoadingState context="network" />);
    const visibleText = screen.getByText('Connecting...', { selector: 'p' });
    expect(visibleText).toBeInTheDocument();
  });

  it('renders skeleton type', () => {
    render(<LoadingState type="skeleton" rows={2} />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('renders shimmer type', () => {
    render(<LoadingState type="shimmer" />);
    const shimmer = screen.getByRole('status');
    expect(shimmer).toBeInTheDocument();
    // Check that the shimmer animation element exists
    const shimmerElement = shimmer.querySelector('.animate-shimmer');
    expect(shimmerElement).toBeInTheDocument();
  });

  it('renders pulse type with context icon', () => {
    render(<LoadingState type="pulse" context="data" />);
    const pulse = screen.getByRole('status');
    expect(pulse).toBeInTheDocument();
    expect(pulse).toHaveClass('animate-pulse');
  });

  it('renders dots type', () => {
    render(<LoadingState type="dots" />);
    const dots = screen.getByRole('status');
    expect(dots).toBeInTheDocument();
    // Check for bounce animation classes
    const bouncingDots = dots.querySelectorAll('.animate-bounce');
    expect(bouncingDots).toHaveLength(3);
  });

  it('applies size configurations correctly', () => {
    render(<LoadingState size="lg" />);
    const statusElement = screen.getByRole('status');
    const spinner = statusElement.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-16', 'h-16');
  });

  it('includes screen reader text', () => {
    render(<LoadingState />);
    const srText = screen.getByText('Loading...', { selector: '.sr-only' });
    expect(srText).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingState />);
    const statusElement = screen.getByRole('status');
    expect(statusElement).toHaveAttribute('aria-live', 'polite');
  });
});