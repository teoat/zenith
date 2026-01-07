/**
 * Error reporting service for frontend error handling and reporting.
 * Provides centralized error logging, user feedback, and optional remote reporting.
 */

import { secureLogger } from '@/utils/secureLogger';

interface ErrorReport {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, unknown>;
}

class ErrorReportingService {
  // ... (keeping existing private props)
  private static instance: ErrorReportingService;
  private errorQueue: ErrorReport[] = [];
  private isReportingEnabled = process.env.NODE_ENV === 'production';
  private maxQueueSize = 50;

  private constructor() {
    this.setupGlobalHandlers();
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private setupGlobalHandlers(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled promise rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'high',
        context: { type: 'unhandledrejection' }
      });
    });

    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        component: 'global',
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }

  reportError(error: Partial<ErrorReport> & { message: string }): void {
    // ... existing implementation ...
    const errorReport: ErrorReport = {
      stack: error.stack,
      component: error.component || 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      severity: error.severity || 'medium',
      context: error.context || {},
      ...error
    };

    this.errorQueue.push(errorReport);

    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    if (process.env.NODE_ENV === 'development') {
      secureLogger.debug('ERROR_REPORTING', 'Error reported', errorReport);
    }

    if (this.isReportingEnabled) {
      this.sendToRemoteService(errorReport);
    }
  }

  private async sendToRemoteService(errorReport: ErrorReport): Promise<void> {
    try {
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });

      if (!response.ok) {
        secureLogger.warn('ERROR_REPORTING', 'Failed to send error report to remote service');
      }
    } catch (error) {
      secureLogger.warn('ERROR_REPORTING', 'Error reporting service failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  getErrorReports(): ErrorReport[] {
    return [...this.errorQueue];
  }

  clearErrorReports(): void {
    this.errorQueue = [];
  }

  setReportingEnabled(enabled: boolean): void {
    this.isReportingEnabled = enabled;
  }

  reportReactError(error: Error, errorInfo: { componentStack: string }, componentName?: string): void {
    this.reportError({
      message: `React Error: ${error.message}`,
      stack: error.stack,
      component: componentName || 'ReactComponent',
      severity: 'high',
      context: {
        componentStack: errorInfo.componentStack,
        type: 'react_error'
      }
    });
  }

  reportApiError(error: unknown, endpoint: string, method: string = 'GET'): void {
    const message = error instanceof Error ? error.message : 
                    (typeof error === 'object' && error && 'message' in error) ? String((error as any).message) : 'Unknown API error';
    const status = (typeof error === 'object' && error && 'status' in error) ? (error as any).status : undefined;

    this.reportError({
      message: `API Error: ${message}`,
      component: 'API',
      severity: 'medium',
      context: {
        endpoint,
        method,
        status,
        type: 'api_error'
      }
    });
  }
}

// Export singleton instance
export const errorReporting = ErrorReportingService.getInstance();

// Export types
export type { ErrorReport };