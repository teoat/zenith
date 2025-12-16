// Mock for client.ts to avoid import.meta issues in tests
export const API_BASE = 'http://localhost:8000/api/v1';

export const isElectron = (): boolean => false;

export const getToken = (): string | null => localStorage.getItem('token');

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

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }

  return response.json();
};