import { useCallback, useRef, useEffect } from 'react';
import type { ApiError, NetworkError, BaseError } from '../types/common';

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

interface RequestConfig extends RequestInit {
  timeout?: number;
}

interface HttpError extends Error {
  status?: number;
  response?: Response;
}

/**
 * Hook for making HTTP requests with automatic retry logic
 * Implements exponential backoff and configurable retry strategies
 */
export function useHttpClient() {
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    // Cleanup: abort all pending requests on unmount
    return () => {
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  const request = useCallback(async <T = unknown>(
    url: string,
    config: RequestConfig = {},
    retryOptions: RetryOptions = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      delayMs = 1000,
      backoffMultiplier = 2,
      shouldRetry = (error, attempt) => {
        // Default: retry on network errors and 5xx status codes
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          return attempt < maxRetries;
        }
        if ('status' in error && typeof error.status === 'number') {
          return error.status >= 500 && attempt < maxRetries;
        }
        return false;
      }
    } = retryOptions;

    const { timeout = 30000, ...fetchConfig } = config;

    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Create abort controller for this request
      const controller = new AbortController();
      const requestId = `${url}-${Date.now()}`;
      abortControllersRef.current.set(requestId, controller);

      // Set up timeout
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchConfig,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        abortControllersRef.current.delete(requestId);

        if (!response.ok) {
          const error: HttpError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.response = response;
          throw error;
        }

        const data = await response.json();
        return data as T;

      } catch (error: unknown) {
        clearTimeout(timeoutId);
        abortControllersRef.current.delete(requestId);

        // Type guard for Error objects
        const err = error instanceof Error ? error : new Error('Unknown error occurred');
        lastError = err;

        // Don't retry if request was aborted by user
        if (err.name === 'AbortError' && attempt === 0) {
          throw err;
        }

        // Check if we should retry
        if (attempt < maxRetries && shouldRetry(err, attempt)) {
          const delay = delayMs * Math.pow(backoffMultiplier, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw err;
      }
    }

    throw lastError!;
  }, []);

  const get = useCallback(<T = unknown>(
    url: string,
    config?: RequestConfig,
    retryOptions?: RetryOptions
  ) => {
    return request<T>(url, { ...config, method: 'GET' }, retryOptions);
  }, [request]);

  const post = useCallback(<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
    retryOptions?: RetryOptions
  ) => {
    return request<T>(url, {
      ...config,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    }, retryOptions);
  }, [request]);

  const put = useCallback(<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
    retryOptions?: RetryOptions
  ) => {
    return request<T>(url, {
      ...config,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    }, retryOptions);
  }, [request]);

  const del = useCallback(<T = unknown>(
    url: string,
    config?: RequestConfig,
    retryOptions?: RetryOptions
  ) => {
    return request<T>(url, { ...config, method: 'DELETE' }, retryOptions);
  }, [request]);

  const abort = useCallback((url?: string) => {
    if (url) {
      // Abort specific URL requests
      abortControllersRef.current.forEach((controller, key) => {
        if (key.startsWith(url)) {
          controller.abort();
          abortControllersRef.current.delete(key);
        }
      });
    } else {
      // Abort all requests
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    }
  }, []);

  return {
    request,
    get,
    post,
    put,
    delete: del,
    abort
  };
}

/**
 * Standalone retry wrapper for any async function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      // Type guard for Error objects
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      lastError = err;

      if (attempt < maxRetries && shouldRetry(err, attempt)) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw err;
    }
  }

  throw lastError!;
}
