import { secureLogger } from "@/utils/secureLogger";

/**
 * Unified error handler for API and application errors.
 * Provides consistent error handling, logging, and user messaging.
 */
export class UnifiedErrorHandler {
  private static instance: UnifiedErrorHandler;

  private constructor() {}

  static getInstance(): UnifiedErrorHandler {
    if (!UnifiedErrorHandler.instance) {
      UnifiedErrorHandler.instance = new UnifiedErrorHandler();
    }
    return UnifiedErrorHandler.instance;
  }

  /**
   * Handles API errors with logging and user-friendly messaging.
   *
   * @param error - The error object
   * @param context - Additional context for logging
   * @returns User-friendly error message
   */
  handleApiError(error: unknown, context?: Record<string, unknown>): string {
    const errorInfo = this.parseError(error);

    // Log the error securely
    secureLogger.error("API Error", errorInfo.message, {
      statusCode: errorInfo.statusCode,
      endpoint: context?.endpoint,
      method: context?.method,
      ...context,
    });

    // Return user-friendly message
    return errorInfo.userMessage;
  }

  /**
   * Handles general application errors.
   *
   * @param error - The error object
   * @param context - Additional context for logging
   */
  handleAppError(error: unknown, context?: Record<string, unknown>): void {
    const errorInfo = this.parseError(error);

    secureLogger.error("Application Error", errorInfo.message, {
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    });
  }

  /**
   * Parses various error types into a standardized format.
   *
   * @param error - The error to parse
   * @returns Parsed error information
   */
  private parseError(error: unknown): {
    message: string;
    statusCode?: number;
    userMessage: string;
  } {
    if (error instanceof Error) {
      // Check for custom error types or HTTP errors
      if ("status" in error) {
        const httpError = error as Error & { status: number };
        return {
          message: error.message,
          statusCode: httpError.status,
          userMessage: this.getUserFriendlyMessage(
            httpError.status,
            error.message,
          ),
        };
      }

      return {
        message: error.message,
        userMessage: "An unexpected error occurred. Please try again.",
      };
    }

    if (typeof error === "string") {
      return {
        message: error,
        userMessage: error,
      };
    }

    return {
      message: "Unknown error",
      userMessage: "An unexpected error occurred. Please try again.",
    };
  }

  /**
   * Converts HTTP status codes to user-friendly messages.
   *
   * @param statusCode - HTTP status code
   * @param originalMessage - Original error message
   * @returns User-friendly error message
   */
  private getUserFriendlyMessage(
    statusCode: number,
    originalMessage?: string,
  ): string {
    switch (statusCode) {
      case 400:
        return "Invalid request. Please check your input and try again.";
      case 401:
        return "Authentication required. Please log in again.";
      case 403:
        return "Access denied. You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 408:
        return "Request timed out. Please try again.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
        return "Server error occurred. Our team has been notified.";
      case 502:
      case 503:
      case 504:
        return "Service temporarily unavailable. Please try again later.";
      default:
        return (
          originalMessage ||
          `An error occurred (${statusCode}). Please try again.`
        );
    }
  }

  /**
   * Handles network errors specifically.
   *
   * @param error - The network error
   * @returns User-friendly error message
   */
  handleNetworkError(error: unknown): string {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return "Network connection failed. Please check your internet connection.";
    }

    return this.handleApiError(error, { type: "network" });
  }
}

// Export singleton instance
export const errorHandler = UnifiedErrorHandler.getInstance();
