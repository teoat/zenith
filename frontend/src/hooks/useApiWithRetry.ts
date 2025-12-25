import { useState, useCallback } from 'react';

interface UseApiOptions {
  retries?: number;
  retryDelay?: number;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * @deprecated This hook is deprecated. Use the central API client with built-in retry logic instead.
 * The `request` function in `services/client.ts` now handles retries automatically.
 */
export function useApiWithRetry<T>(
  apiFn: () => Promise<T>,
  options: UseApiOptions = {}
) {
  const { retries = 3, retryDelay = 1000 } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await apiFn();
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        lastError = err as Error;
        
        // Don't retry on last attempt
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    setState({ data: null, loading: false, error: lastError });
    throw lastError;
  }, [apiFn, retries, retryDelay]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
    retry: execute
  };
}
