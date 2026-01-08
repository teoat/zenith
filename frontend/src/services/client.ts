import { ApiError, ApiResponse, BaseError } from '../types/common';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Check if running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         window.electronAPI !== undefined;
};

// Get auth token
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Type-safe API error handler
const createApiError = (error: unknown, endpoint?: string, method?: string): ApiError => {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    };
  }
  
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    return {
      message: typeof errorObj.message === 'string' ? errorObj.message : 'Unknown error',
      status: typeof errorObj.status === 'number' ? errorObj.status : 500,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
    };
  }
  
  return {
    message: 'Unknown error occurred',
    status: 500,
    endpoint,
    method,
    timestamp: new Date().toISOString(),
  };
};

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
  
  const token = getToken();
  if (token && token !== 'dev-token-378x492') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      
      const apiError = createApiError(
        errorData.detail || `HTTP ${response.status}`,
        endpoint,
        options.method
      );
      apiError.status = response.status;
      apiError.response = {
        data: errorData,
        status: response.status,
        statusText: response.statusText,
      };
      
      throw apiError;
    }

    const data = await response.json();
    return data as T;
  } catch (err) {
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw our ApiError
    }
    
    const apiError = createApiError(err, endpoint, options.method);
    console.error(`[API] ${options.method || 'GET'} ${endpoint} failed:`, apiError.message);
    throw apiError;
  }
};

// Type-safe HTTP methods
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit): Promise<T> => 
    request<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> => 
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> => 
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: <T>(endpoint: string, options?: RequestInit): Promise<T> => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
