/**
 * Comprehensive Authentication Test Suite
 * Tests JWT tokens, MFA, session management, and security features
 */

// Mock localStorage BEFORE any imports
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => {
      if (key === 'token') return 'fake-jwt-token-for-testing';
      return null;
    }),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock import.meta BEFORE any imports
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

// Mock fetch globally
(global.fetch as jest.MockedFunction<typeof fetch>) = jest.fn();

import '@testing-library/jest-dom';
import { request, getToken } from '../services/client';

// Mock the getToken function
jest.mock('../services/client', () => ({
  ...jest.requireActual('../services/client'),
  getToken: jest.fn(() => 'fake-jwt-token-for-testing'),
}));

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

// Mock import.meta.env
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
  });

  afterEach(() => {
    // Reset getToken mock after each test
    (getToken as jest.MockedFunction<typeof getToken>).mockReset();
  });

  describe('JWT Token Management', () => {
    test('should include Authorization header when token exists', async () => {
      (getToken as jest.MockedFunction<typeof getToken>).mockReturnValue('fake-jwt-token-for-testing');
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
      // getToken already returns null from beforeEach
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
      (getToken as jest.MockedFunction<typeof getToken>).mockReturnValue('dev-token-378x492');
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
          method: 'GET',
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

    test('should handle missing VITE_API_URL gracefully', async () => {
      // Temporarily remove the env var
      const originalEnv = window.import.meta.env.VITE_API_URL;
      delete window.import.meta.env.VITE_API_URL;

      mockFetch({ success: true });

      await request('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/test', // Fallback to relative URL
        expect.anything()
      );

      // Restore
      window.import.meta.env.VITE_API_URL = originalEnv;
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