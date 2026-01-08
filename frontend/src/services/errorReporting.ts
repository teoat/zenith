import { BaseError, ApiError } from '../types/common';

interface ErrorReport {
  id: string;
  type: string;
  message: string;
  stack?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorReportConfig {
  enabled: boolean;
  endpoint?: string;
  maxRetries: number;
  includeStackTrace: boolean;
  includeUserAgent: boolean;
  includeUrl: boolean;
}

class ErrorReportingService {
  private config: ErrorReportConfig;
  private errorQueue: ErrorReport[] = [];
  private isReporting = false;

  constructor(config: Partial<ErrorReportConfig> = {}) {
    this.config = {
      enabled: true,
      maxRetries: 3,
      includeStackTrace: true,
      includeUserAgent: true,
      includeUrl: true,
      ...config
    };
  }

  /**
   * Report an error to the monitoring service
   */
  async reportError(error: Error | BaseError | unknown, context?: Record<string, unknown>): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const errorReport = this.createErrorReport(error, context);
      await this.sendErrorReport(errorReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      this.queueErrorForLater(error, context);
    }
  }

  /**
   * Report API-specific errors with additional context
   */
  async reportApiError(error: unknown, endpoint: string, method: string = 'GET'): Promise<void> {
    if (!this.config.enabled) return;

    let errorMessage = 'Unknown API error';
    let statusCode = 0;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = 
        (typeof (error as any).message === 'string') ? String((error as any).message) : 'Unknown API error';
      statusCode = 
        (typeof (error as any).status === 'number') ? (error as any).status : undefined;
    }

    const apiError: ApiError = {
      message: errorMessage,
      status: statusCode,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    };

    await this.reportError(apiError, {
      type: 'api_error',
      endpoint,
      method,
      status: statusCode,
    });
  }

  /**
   * Create a standardized error report
   */
  private createErrorReport(error: Error | BaseError | unknown, context?: Record<string, unknown>): ErrorReport {
    const now = new Date().toISOString();
    
    let errorReport: ErrorReport = {
      id: this.generateErrorId(),
      type: 'javascript_error',
      message: 'Unknown error occurred',
      timestamp: now,
      metadata: context,
    };

    if (error instanceof Error) {
      errorReport = {
        ...errorReport,
        type: error.constructor.name,
        message: error.message,
        stack: this.config.includeStackTrace ? error.stack : undefined,
      };
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      errorReport = {
        ...errorReport,
        type: (typeof errorObj.type === 'string') ? errorObj.type : 'object_error',
        message: (typeof errorObj.message === 'string') ? errorObj.message : String(error),
      };
    } else if (typeof error === 'string') {
      errorReport = {
        ...errorReport,
        type: 'string_error',
        message: error,
      };
    }

    if (this.config.includeUserAgent && typeof window !== 'undefined') {
      errorReport.userAgent = window.navigator.userAgent;
    }

    if (this.config.includeUrl && typeof window !== 'undefined') {
      errorReport.url = window.location.href;
    }

    return errorReport;
  }

  /**
   * Send error report to monitoring endpoint
   */
  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    if (!this.config.endpoint) {
      console.warn('Error reporting endpoint not configured');
      return;
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });

      if (!response.ok) {
        throw new Error(`Failed to report error: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      throw new Error(`Network error while reporting: ${fetchError instanceof Error ? fetchError.message : 'Unknown'}`);
    }
  }

  /**
   * Queue error for later reporting if immediate reporting fails
   */
  private queueErrorForLater(error: Error | BaseError | unknown, context?: Record<string, unknown>): void {
    try {
      const errorReport = this.createErrorReport(error, context);
      this.errorQueue.push(errorReport);

      // Keep only the last 50 errors
      if (this.errorQueue.length > 50) {
        this.errorQueue.shift();
      }

      // Try to report queued errors after a delay
      setTimeout(() => {
        this.reportQueuedErrors();
      }, 5000);
    } catch (queueError) {
      console.error('Failed to queue error:', queueError);
    }
  }

  /**
   * Report all queued errors
   */
  private async reportQueuedErrors(): Promise<void> {
    if (this.isReporting || this.errorQueue.length === 0) return;

    this.isReporting = true;
    const queuedErrors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await Promise.allSettled(
        queuedErrors.map(errorReport => 
          this.sendErrorReport(errorReport).catch(err => 
            console.error('Failed to report queued error:', err)
          )
        )
      );
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current configuration
   */
  getConfig(): ErrorReportConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorReportConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get queued errors count
   */
  getQueuedErrorsCount(): number {
    return this.errorQueue.length;
  }

  /**
   * Clear queued errors
   */
  clearQueuedErrors(): void {
    this.errorQueue = [];
  }
}

// Export singleton instance
export const errorReportingService = new ErrorReportingService();

// Export convenience functions
export const reportError = (error: Error | BaseError | unknown, context?: Record<string, unknown>) => 
  errorReportingService.reportError(error, context);

export const reportApiError = (error: unknown, endpoint: string, method?: string) => 
  errorReportingService.reportApiError(error, endpoint, method);

export default errorReportingService;
