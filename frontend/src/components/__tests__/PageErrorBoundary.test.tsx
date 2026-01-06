
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PageErrorBoundary from '../PageErrorBoundary';

describe('PageErrorBoundary', () => {
  const originalError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <PageErrorBoundary>
        <div>Test Content</div>
      </PageErrorBoundary>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders error page when child component throws an error', () => {
    const ThrowError = () => {
      throw new Error('Page error');
    };

    render(
      <PageErrorBoundary>
        <ThrowError />
      </PageErrorBoundary>
    );

    expect(screen.getByText("This content couldn't be loaded")).toBeInTheDocument();
    expect(screen.getByText('We encountered an unexpected error while trying to display this page. Detailed technical information has been logged for our team.')).toBeInTheDocument();
  });

  it('logs error information', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    const ThrowError = () => {
      throw new Error('Logged error');
    };

    render(
      <PageErrorBoundary>
        <ThrowError />
      </PageErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR] Page error caught:'),
      expect.objectContaining({
        error_message: 'Logged error',
        error_name: 'Error'
      })
    );

    consoleSpy.mockRestore();
  });

  it('provides retry functionality', () => {
    const ThrowError = () => {
      throw new Error('Retry test error');
    };

    render(
      <PageErrorBoundary>
        <ThrowError />
      </PageErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
  });

  it('includes proper error messaging and actions', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <PageErrorBoundary>
        <ThrowError />
      </PageErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it('handles different error types gracefully', () => {
    const ThrowStringError = () => {
      throw 'String error';
    };

    render(
      <PageErrorBoundary>
        <ThrowStringError />
      </PageErrorBoundary>
    );

    expect(screen.getByText("This content couldn't be loaded")).toBeInTheDocument();
  });

  it('maintains layout structure in error state', () => {
    const ThrowError = () => {
      throw new Error('Layout test error');
    };

    render(
      <PageErrorBoundary>
        <ThrowError />
      </PageErrorBoundary>
    );

    // Check that the error UI has proper structure
    const container = screen.getByText("This content couldn't be loaded").closest('.min-h-\\[400px\\]');
    expect(container).toBeInTheDocument();
  });
});