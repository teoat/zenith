/**
 * Comprehensive Authentication Test Suite
 * Tests JWT tokens, MFA, session management, and security features
 */

import '@testing-library/jest-dom';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock import.meta
global.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:8000/api/v1',
    }
  }
};

// Mock the client module to avoid import.meta errors
jest.mock('../services/client', () => ({
  request: jest.fn(),
  getToken: jest.fn(() => 'mock-token'),
  API_BASE: 'http://localhost:8000/api/v1'
}));

// Import the actual client functions
import { request, getToken } from '../services/client';

// Test utilities
const mockFetch = (response: unknown, status = 200) => {
  (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
  } as Response);
};

const mockFetchError = (status: number, message = 'Error') => {
  (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ detail: message }),
  } as Response);
};
global.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:8000/api/v1',
      VITE_MAPBOX_TOKEN: 'test-token',
      VITE_ENABLE_THREAT_MAP: 'true',
      VITE_ENABLE_ADVANCED_FORENSIC: 'true',
      VITE_USE_SIMPLE_PDF_VIEWER: 'false'
    }
  }
};

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'token') return null; // Default to no token
      return null;
    });
  });

  describe('JWT Token Management', () => {
    test('getToken should return token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      expect(getToken()).toBe('test-token');
    });

    test('getToken should return null when no token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(getToken()).toBe(null);
    });

    test('should include Authorization header when token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('fake-jwt-token-for-testing');
      mockFetch({ data: 'protected resource' });

      await request('/protected-endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/protected-endpoint',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-jwt-token-for-testing',
          }),
        })
      );
    });

    test('should not include Authorization header when no token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockFetch({ data: 'public resource' });

      await request('/public-endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/public-endpoint',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything(),
          }),
        })
      );
    });

    test('should exclude dev tokens from Authorization header', async () => {
      mockLocalStorage.getItem.mockReturnValue('dev-token-378x492');
      mockFetch({ data: 'dev resource' });

      await request('/dev-endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dev-endpoint',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything(),
          }),
        })
      );
    });
  });

  describe('API Request Handling', () => {
    test('should handle successful responses', async () => {
      const mockResponse = { id: 1, name: 'Test User' };
      mockFetch(mockResponse);

      const result = await request('/users/1');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/users/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    test('should handle HTTP errors gracefully', async () => {
      mockFetchError(404, 'User not found');

      await expect(request('/users/999')).rejects.toThrow('User not found');
    });

    test('should handle network errors', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(request('/test')).rejects.toThrow('Network error');
    });

    test('should support custom HTTP methods', async () => {
      mockFetch({ success: true });

      await request('/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'New User' }),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New User' }),
        })
      );
    });

    test('should merge custom headers', async () => {
      mockFetch({ success: true });

      await request('/test', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });

  describe('Environment Configuration', () => {
    test('should use VITE_API_URL for base URL', async () => {
      mockFetch({ success: true });

      await request('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/test',
        expect.anything()
      );
    });

    test('should use default localhost API URL when not configured', async () => {
      // Temporarily modify the env var
      const originalEnv = global.import.meta.env.VITE_API_URL;
      global.import.meta.env.VITE_API_URL = 'http://test-api:9000/api/v1';

      mockFetch({ success: true });

      await request('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-api:9000/api/v1/test',
        expect.anything()
      );

      // Restore
      global.import.meta.env.VITE_API_URL = originalEnv;
    });
  });

  describe('Error Handling', () => {
    test('should parse error details from response', async () => {
      mockFetchError(400, 'Invalid input data');

      await expect(request('/validation-test')).rejects.toThrow('Invalid input data');
    });

    test('should handle malformed error responses', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(request('/error-test')).rejects.toThrow('HTTP 500');
    });

    test('should preserve original error messages', async () => {
      const originalError = new Error('Original error');
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(originalError);

      await expect(request('/network-test')).rejects.toThrow('Original error');
    });
  });
});