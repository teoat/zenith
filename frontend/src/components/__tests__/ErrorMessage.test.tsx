import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders string error with default styling', () => {
    render(<ErrorMessage error="Test error" />);

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders error object with message', () => {
    render(<ErrorMessage error={{ message: 'Test error', category: 'client_error' }} />);

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders error code when provided', () => {
    render(<ErrorMessage error={{ message: 'Test error', code: 'ERR_001', category: 'client_error' }} />);

    expect(screen.getByText('ERR_001')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<ErrorMessage error="Test error" className="custom-class" />);

    const container = screen.getByText('Test error').closest('.border');
    expect(container).toHaveClass('custom-class');
  });

  it('renders different error categories with appropriate styling', () => {
    const { rerender } = render(<ErrorMessage error={{ message: 'Error', category: 'server_error' }} />);
    expect(screen.getByText('Error').closest('.bg-red-50')).toBeInTheDocument();

    rerender(<ErrorMessage error={{ message: 'Warning', category: 'validation_error' }} />);
    expect(screen.getByText('Warning').closest('.bg-amber-50')).toBeInTheDocument();

    rerender(<ErrorMessage error={{ message: 'Info', category: 'not_found_error' }} />);
    expect(screen.getByText('Info').closest('.bg-blue-50')).toBeInTheDocument();
  });

  it('renders suggestion when provided', () => {
    render(<ErrorMessage error={{ message: 'Test error', suggestion: 'Try again later', category: 'client_error' }} />);

    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });

  it('renders dismissible error with close button', () => {
    const onDismiss = jest.fn();
    render(<ErrorMessage error="Test error" onDismiss={onDismiss} />);

    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when onDismiss not provided', () => {
    render(<ErrorMessage error="Test error" />);

    const closeButton = screen.queryByRole('button');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('returns null when no error provided', () => {
    const { container } = render(<ErrorMessage />);
    expect(container.firstChild).toBeNull();
  });

  it('handles error context information', () => {
    render(<ErrorMessage error={{
      message: 'Test error',
      category: 'client_error',
      context: { field: 'email', value: 'invalid' }
    }} />);

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders appropriate icons for different error categories', () => {
    const { rerender } = render(<ErrorMessage error={{ message: 'Error', category: 'server_error' }} />);
    expect(document.querySelector('svg')).toBeInTheDocument();

    rerender(<ErrorMessage error={{ message: 'Warning', category: 'validation_error' }} />);
    expect(document.querySelector('svg')).toBeInTheDocument();

    rerender(<ErrorMessage error={{ message: 'Info', category: 'not_found_error' }} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with proper accessibility attributes', () => {
    render(<ErrorMessage error="Test error" />);

    const errorElement = screen.getByRole('alert');
    expect(errorElement).toBeInTheDocument();
  });

  it('handles long error messages', () => {
    const longMessage = 'A'.repeat(200);
    render(<ErrorMessage error={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('defaults to client_error category for string errors', () => {
    render(<ErrorMessage error="Test error" />);

    // Should have amber styling for client_error
    const container = screen.getByText('Test error').closest('.bg-amber-50');
    expect(container).toBeInTheDocument();
  });
});