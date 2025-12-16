export const API_BASE = 'http://localhost:8000/api/v1';

// Check if running in Electron
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         window.electronAPI !== undefined;
};

// Get auth token
export const getToken = (): string | null => {
  return localStorage.getItem('token');
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

  // Dummy trusted hash for demonstration. In production, this would be securely fetched.
  const trustedPublicKeyHashes = ["dummy_hash_for_development"]; 

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Server-assisted pinning for web browsers (conceptual)
    if (!isElectron()) { // Only for web browser environment
      const serverPublicKeyHash = response.headers.get('X-Public-Key-Hash');
      if (serverPublicKeyHash && !trustedPublicKeyHashes.includes(serverPublicKeyHash)) {
        throw new Error('Certificate pinning failed: Server public key hash mismatch!');
      }
    }

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
