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
const fetchSpy = jest.spyOn(global, 'fetch');

// Mock config module - This mocks the 'API_BASE' imported by client.ts
jest.mock('../config', () => ({
  API_BASE: 'http://localhost:8000/api/v1',
  WS_URL: 'ws://localhost:8000',
  ENVIRONMENT: 'test'
}));

// Mock secureLogger to prevent console noise
jest.mock('../utils/secureLogger', () => ({
  secureLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}));

// Import the actual client functions
import { request } from '@/services/client';

// Test utilities
const mockFetch = (response: unknown, status = 200) => {
  fetchSpy.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
  } as unknown as Response);
};

const mockFetchError = (status: number, message = 'Error') => {
  fetchSpy.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ detail: message }),
  } as unknown as Response);
};

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default success, using mockResolvedValue (not Once) to handle potential retries if needed for default state
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as unknown as Response);
  });

  // Cookie-based Authentication Tests
  describe('Cookie-based Authentication', () => {
    test('should NOT include Authorization header (relies on cookies)', async () => {
      mockFetch({ data: 'protected resource' });

      await request('/protected-endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/protected-endpoint'),
        expect.objectContaining({
            // Ensure no Authorization header is present
            headers: expect.not.objectContaining({
                'Authorization': expect.stringContaining('Bearer'),
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

      await expect(request('/users/999')).rejects.toThrow('The requested resource was not found.');
    });

    test('should handle network errors', async () => {
      // Client has 2 retries (total 3 attempts). Mock 3 failures.
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

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
    test('should use API_BASE for base URL', async () => {
      mockFetch({ success: true });

      await request('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/test',
        expect.anything()
      );
    });
  });

  describe('Error Handling', () => {
    test('should parse error details from response', async () => {
      mockFetchError(400, 'Invalid input data');

      await expect(request('/test')).rejects.toThrow('Invalid request. Please check your input and try again.');
    });

    test('should handle malformed error responses', async () => {
      // Use mockResolvedValue (persistent) to fail retries as well
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      await expect(request('/error-test')).rejects.toThrow('Server error occurred');
    });
  });
});