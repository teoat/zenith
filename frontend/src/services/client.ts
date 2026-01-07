import { ApiError } from '@/errors/ApiError';
export { API_BASE } from '@/config';
import { secureLogger } from '@/utils/secureLogger';
import { createCircuitBreaker, DEFAULT_CIRCUIT_CONFIGS } from '@/lib/circuitBreaker';
import { addCsrfHeader } from '@/utils/csrfProtection';
import { API_BASE } from '@/config';

// Create circuit breaker for API calls
const apiCircuitBreaker = createCircuitBreaker('api-service', DEFAULT_CIRCUIT_CONFIGS.api);

/**
 * Convert HTTP status codes and error messages to user-friendly messages
 */
function getUserFriendlyErrorMessage(statusCode: number, originalMessage?: string): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please log in again.';
    case 403:
      return 'Access denied. You don\'t have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 408:
      return 'Request timed out. Please try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error occurred. Our team has been notified.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return originalMessage || `An error occurred (${statusCode}). Please try again.`;
  }
}


// Check if running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         window.electronAPI !== undefined;
};

// Token management is now handled via HttpOnly cookies
// export const getToken = ... (Removed)

// Core request method - works in both browser and Electron
export const request = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  // Headers setup (Cookies are sent automatically by browser)
  // No need to manually inject Authorization header anymore

  // Inject Project ID if active
  try {
    const { useProjectStore } = await import('../store/projectStore');
    const { activeProjectId } = useProjectStore.getState();
    if (activeProjectId) {
      headers['X-Project-ID'] = activeProjectId;
    }
  } catch (error) {
    secureLogger.debug('API', 'Failed to inject Project ID', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }

   // NOTE: Certificate pinning logic removed for web compatibility.
   // In production, rely on standard TLS/SSL CA trust or implement secure pinning in Electron/Native layer.

   // Add CSRF protection for state-changing requests
   const method = options.method || 'GET';
   const finalHeaders = await addCsrfHeader(headers, method);

    try {
      // Wrap the API call with circuit breaker protection and retry logic
      return await apiCircuitBreaker.execute(async () => {
        let lastError: Error | null = null;
        const maxRetries = 2;
        const retryDelay = 1000; // 1 second

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const response = await fetch(url, {
              ...options,
              headers: finalHeaders,
            });

            if (!response || !response.ok) {
              if (!response) {
                // Network error - fetch returned undefined or failed
                throw new Error('Network error');
              }

              // Interceptor: Handle 401 Unauthorized with Silent Refresh
              // Do not retry if the failed request was already a refresh attempt
              if (response.status === 401 && !endpoint.includes('/auth/refresh') && !(options as any)._retry) {
                  secureLogger.debug('API', '401 detected, attempting silent refresh');
                  try {
                      // Call refresh endpoint
                      // Note: We avoid using the wrapper 'request' to prevent infinite loops,
                      // but we MUST ensure we send credentials (cookies)
                      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
                          method: 'POST',
                          headers: { 
                              'Content-Type': 'application/json',
                              // Include CSRF token if needed for the refresh call itself? 
                              // Ideally refresh is safe or has its own protection. 
                              // For now, assume cookies are sufficient or CSRF header is added if we used logic.
                              // Let's use the same finalHeaders but ensuring it's POST
                          }
                      });

                      if (refreshRes.ok) {
                          secureLogger.info('API', 'Silent refresh successful, retrying original request');
                          // Retry original request with_retry flag to prevent infinite loop
                          return request(endpoint, { ...options, _retry: true } as any);
                      } else {
                          secureLogger.warn('API', 'Silent refresh failed');
                          // Allow 401 to propagate to trigger logout/redirect
                      }
                  } catch (refreshError) {
                      secureLogger.error('API', 'Error during silent refresh', { error: String(refreshError) });
                  }
              }

              const errorData = await response.json().catch(() => ({ detail: response.statusText }));

              // Create more user-friendly error messages
              const userFriendlyMessage = getUserFriendlyErrorMessage(response.status, errorData.detail);
              throw new ApiError(userFriendlyMessage, response.status, errorData.detail);
            }

            return response.json();
          } catch (error) {
            lastError = error as Error;

            // Don't retry on client errors (4xx) except 408, 429
            const shouldRetry = attempt < maxRetries &&
              (!(error instanceof ApiError) ||
               [408, 429, 500, 502, 503, 504].includes((error as ApiError).statusCode));

            if (!shouldRetry) {
              break;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            secureLogger.warn('API', `Retrying ${options.method || 'GET'} ${endpoint} (attempt ${attempt + 1}/${maxRetries + 1})`);
          }
        }

        throw lastError;
      });
    } catch (error) {
      secureLogger.error('API', `${options.method || 'GET'} ${endpoint} failed`, {
          error: error instanceof Error ? error.message : String(error),
          statusCode: error instanceof ApiError ? error.statusCode : undefined,
          originalMessage: error instanceof ApiError ? error.originalMessage : undefined
      });
      throw error;
    }
};
