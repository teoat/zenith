/**
 * API Error Handler Hook
 * 
 * Integrates with backend error handling to display user-friendly messages
 */

import { useState, useCallback } from 'react';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { secureLogger } from '@/utils/secureLogger';

interface ErrorDetails {
  code?: string;
  category?: string;
  message: string;
  suggestion?: string;
  context?: Record<string, unknown>;
}

interface ApiError {
  error?: ErrorDetails;
}

interface AxiosErrorConfig {
  url?: string;
  method?: string;
}

interface AxiosErrorResponse {
  status?: number;
  data?: ApiError;
}

interface CustomAxiosError {
  config?: AxiosErrorConfig;
  response?: AxiosErrorResponse;
  message?: string;
}

export const useApiError = () => {
  const [error, setError] = useState<ErrorDetails | null>(null);

  const handleError = useCallback((err: unknown) => {
    secureLogger.error('API Error:', err);

    // Type guard for error with response
    const axiosError = err as CustomAxiosError;

    // Check if it's our structured error format
    if (axiosError.response?.data?.error) {
      setError(axiosError.response.data.error);
    } else if (err instanceof Error) {
      // Standard Error object
      setError({
        code: 'unknown_error',
        category: 'server_error',
        message: err.message || 'An unexpected error occurred',
        suggestion: 'Please try again later or contact support.'
      });
    } else if (typeof err === 'object' && err !== null && 'message' in err) {
      // Object with message property
      const errorWithMessage = err as { message: string; category?: string };
      setError({
        code: 'unknown_error',
        category: errorWithMessage.category || 'server_error',
        message: errorWithMessage.message || 'An unexpected error occurred',
        suggestion: 'Please try again later or contact support.'
      });
    } else {
      // Fallback
      setError({
        code: 'unknown_error',
        category: 'server_error',
        message: 'An unexpected error occurred',
        suggestion: 'Please try again later or contact support.'
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};

// Axios interceptor for automatic error handling
export const setupErrorInterceptor = (axiosInstance: AxiosInstance): void => {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError<ApiError>) => {
      // Log for debugging
      secureLogger.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      });

      // Return structured error
      if (error.response?.data?.error) {
        return Promise.reject(error.response.data);
      }

      // Generic error
      return Promise.reject({
        error: {
          code: 'network_error',
          category: 'client_error',
          message: error.message || 'Network error occurred',
          suggestion: 'Please check your connection and try again.'
        }
      });
    }
  );
};
