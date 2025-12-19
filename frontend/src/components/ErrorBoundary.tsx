import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { secureLogger } from '../utils/secureLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    secureLogger.error('Uncaught error:', error, errorInfo);

    // Categorize error type
    const errorCategory = this.categorizeError(error);

    // Report error to monitoring service
    this.reportError(error, errorInfo, errorCategory);
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    } else if (message.includes('chunk') || message.includes('loading')) {
      return 'loading';
    } else if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    } else if (message.includes('timeout')) {
      return 'timeout';
    } else if (message.includes('memory') || message.includes('out of memory')) {
      return 'memory';
    } else {
      return 'unknown';
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo, category: string) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous',
      category: category,
      severity: this.getSeverityLevel(category),
      recoverable: this.isRecoverable(category)
    };

    // Send to error reporting service (e.g., Sentry)
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          category: category,
          severity: errorReport.severity
        }
      });
    }

    // Send error report to secure logging service
    secureLogger.error('ERROR_BOUNDARY', 'Error boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });
  }

  private getSeverityLevel(category: string): string {
    const severityMap: { [key: string]: string } = {
      'network': 'medium',
      'loading': 'low',
      'permission': 'high',
      'timeout': 'medium',
      'memory': 'critical',
      'unknown': 'high'
    };
    return severityMap[category] || 'medium';
  }

  private isRecoverable(category: string): boolean {
    const recoverableCategories = ['network', 'loading', 'timeout'];
    return recoverableCategories.includes(category);
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const category = this.state.error ? this.categorizeError(this.state.error) : 'unknown';
      const isRecoverable = this.isRecoverable(category);

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 animate-slideUp">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full animate-pulse">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h3 className="mt-4 text-xl font-semibold text-center text-slate-900 dark:text-white">
              Oops! Something went wrong
            </h3>

            <p className="mt-2 text-sm text-center text-slate-600 dark:text-slate-400">
              {isRecoverable
                ? "This looks like a temporary issue. Let's try to fix it."
                : "We encountered an unexpected error. Our team has been notified."
              }
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Technical Details
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                    {this.state.error.toString()}
                  </pre>
                </details>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {isRecoverable && this.state.retryCount < 2 && (
                <button
                  onClick={this.handleRetry}
                  className="w-full inline-flex justify-center items-center px-4 py-3 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again ({this.state.retryCount + 1}/2)
                </button>
              )}

              <button
                onClick={() => window.location.reload()}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Page
              </button>

              <button
                onClick={() => window.history.back()}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Error ID: {Date.now().toString(36)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
