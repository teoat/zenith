import { secureLogger } from './secureLogger';
import { api } from '@/lib/api';

export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    secureLogger.error('SYSTEM', 'Unhandled promise rejection', {
      reason: event.reason?.message || String(event.reason),
      stack: event.reason?.stack
    });
    
    sendErrorReport({
      type: 'unhandled_promise_rejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    secureLogger.error('SYSTEM', 'Uncaught error detected', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });

    sendErrorReport({
      type: 'uncaught_error',
      message: event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  });

  // Handle React error boundaries that don't catch everything
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Check if this is a React error
    if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
        args[0]?.includes?.('Warning: React.createFactory is deprecated')) {
      // Ignore React deprecation warnings
      return;
    }

    // Ignore SecureLogger output to prevent recursion (starts with [CATEGORY])
    if (typeof args[0] === 'string' && args[0].match(/^\[.*\]/)) {
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        originalConsoleError.apply(console, args);
      }
      return;
    }

    // Log other errors using secureLogger instead of original console
    secureLogger.error('CONSOLE', args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));

    // Report critical errors
    if (args[0]?.includes?.('Critical') || args[0]?.includes?.('Error')) {
      sendErrorReport({
        type: 'console_error',
        message: args.join(' '),
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    }
    
    // Fallback to original console in development to avoid missing it in the terminal
    if (process.env.NODE_ENV === 'development') {
      originalConsoleError.apply(console, args);
    }
  };
};

interface ErrorData {
  type: string;
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: string;
  url: string;
  userAgent?: string;
}

const sendErrorReport = (errorData: ErrorData) => {
  api.reportError(errorData);
  secureLogger.debug('SYSTEM', 'Error reported to monitoring service', { type: errorData.type });
};