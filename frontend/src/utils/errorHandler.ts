// frontend/src/utils/errorHandler.ts
import { api } from '../lib/api';

export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
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
    console.error('Uncaught error:', event.error);
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
      // Ignore React deprecation warnings in production
      return;
    }

    // Log other errors
    originalConsoleError.apply(console, args);

    // Report critical errors
    if (args[0]?.includes?.('Critical') || args[0]?.includes?.('Error')) {
      sendErrorReport({
        type: 'console_error',
        message: args.join(' '),
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
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
  // Send to monitoring service via API
  // Using imported api (need to import it at top)
  // For now using api global if available or importing
  // Since this is a util, we should import api
  api.reportError(errorData);

  // In development, also log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('Error reported:', errorData);
  }
};