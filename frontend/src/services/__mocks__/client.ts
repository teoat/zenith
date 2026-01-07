/**
 * Mock client for testing
 * 
 * NOTE: This mock does NOT use localStorage for tokens.
 * Authentication is handled via HttpOnly cookies in production.
 */

export const API_BASE = 'http://localhost:8000/api/v1';

// Mock request function for tests
export const request = jest.fn().mockImplementation(async (endpoint: string, _options?: RequestInit) => {
  // Return mock data based on endpoint
  if (endpoint.includes('/auth/me')) {
    return { id: '1', email: 'test@example.com', role: 'ANALYST' };
  }
  if (endpoint.includes('/auth/login')) {
    return { id: '1', email: 'test@example.com', role: 'ANALYST', full_name: 'Test User' };
  }
  if (endpoint.includes('/auth/logout')) {
    return { message: 'Logged out' };
  }
  if (endpoint.includes('/auth/refresh')) {
    return { message: 'Token refreshed' };
  }
  return {};
});

// Mock API object
export const api = {
  getMe: jest.fn().mockResolvedValue({ id: '1', email: 'test@example.com', role: 'ANALYST' }),
  login: jest.fn().mockResolvedValue({ id: '1', email: 'test@example.com', role: 'ANALYST' }),
  logout: jest.fn().mockResolvedValue({ message: 'Logged out' }),
  refreshToken: jest.fn().mockResolvedValue({ message: 'Token refreshed' }),
};

// Utility exports (no localStorage)
export const isElectron = (): boolean => false;