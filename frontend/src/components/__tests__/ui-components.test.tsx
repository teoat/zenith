import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingState from '@/LoadingState';

describe('LoadingState Component', () => {
  test('renders spinner by default', () => {
    render(<LoadingState />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('renders custom text', () => {
    render(<LoadingState text="Please wait..." />);
    expect(screen.getAllByText('Please wait...')[0]).toBeInTheDocument();
  });

  test('renders skeleton loading', () => {
    render(<LoadingState type="skeleton" />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  test('renders dots loading', () => {
    render(<LoadingState type="dots" />);
    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });

  test('renders skeleton with custom rows', () => {
    render(<LoadingState type="skeleton" rows={5} />);
    const skeletonRows = document.querySelectorAll('.space-y-3');
    expect(skeletonRows).toHaveLength(5);
  });

  test('has proper accessibility attributes', () => {
    render(<LoadingState />);
    const statusElement = screen.getByRole('status');
    expect(statusElement).toBeInTheDocument();
  });
});
