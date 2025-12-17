// Safe access to environment variables for both Vite and Jest
let apiBase = 'http://localhost:8000/api/v1';

try {
  // Hide import.meta from CJS parsers (Jest)
  // This fails gracefully if import.meta is not allowed
  const getMeta = new Function('try { return import.meta; } catch { return undefined; }');
  const meta = getMeta();
  
  if (meta && meta.env && meta.env.VITE_API_URL) {
    apiBase = meta.env.VITE_API_URL;
  }
} catch (_e) {
  // Fallback for environments where new Function is restricted or fails
  if (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) {
    apiBase = process.env.VITE_API_URL;
  }
}

export const API_BASE = apiBase;

// Check if running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         window.electronAPI !== undefined;
};

// Get auth token
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Add type definition for Electron global
declare global {
  interface Window {
    electronAPI?: unknown;
  }
}

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

  // NOTE: Certificate pinning logic removed for web compatibility. 
  // In production, rely on standard TLS/SSL CA trust or implement secure pinning in Electron/Native layer.

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    console.error(`[API] ${options.method || 'GET'} ${endpoint} failed:`, error.message);
    throw error;
  }
};
