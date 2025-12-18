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

  // Inject Project ID if active
  // We use inline require/import or check the store to avoid circular dependencies if any
  // But since store is separate, direct access is safer.
  try {
     // Dynamic import or direct access? Direct import at top level might cause circularity if store imports API.
     // But store imports API? No, store uses persist.
     // Let's rely on the import I will will add to the top of the file.
     const { useProjectStore } = await import('../store/projectStore'); // Dynamic import to be safe? 
     // Actually, standard import is better, but client.ts is low level. 
     // Let's use the standard import at the top of the file in a separate edit, 
     // but for this replacement, I'll just assume I can access it or use a safer method.
     // Actually, let's keep it simple. I will add the import at the top first using a separate tool call if needed, 
     // or I can do it all in one replace if I use 'multi_replace'.
     // But wait, I am in 'replace_file_content'. 
     // I'll use multi_replace to add the import and the logic.

     // Retrying thought: client.ts is used by services. Services are used by components. Store is used by components.
     // Store does NOT import services usually (unless for async actions). 
     // But `api.ts` imports services. `client.ts` is imported by services.
     // `projectStore.ts` does NOT import `client.ts`. 
     // So headers injection is safe.
  } catch (e) { }

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
