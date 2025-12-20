import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should load token from localStorage', () => {
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initializeAuth();
      });

      expect(result.current.token).toBe('stored-token');
      expect(result.current.user).toEqual({ id: '1', email: 'test@example.com' });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('login', () => {
    it('should set user and token on login', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth({
          user: { id: '1', email: 'test@example.com', role: 'investigator' },
          token: 'auth-token'
        });
      });

      expect(result.current.user).toEqual({
        id: '1',
        email: 'test@example.com',
        role: 'investigator'
      });
      expect(result.current.token).toBe('auth-token');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should save auth to localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth({
          user: { id: '1', email: 'test@example.com', role: 'investigator' },
          token: 'auth-token'
        });
      });

      expect(localStorage.getItem('token')).toBe('auth-token');
      expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual({
        id: '1',
        email: 'test@example.com',
        role: 'investigator'
      });
    });

    it('should clear error on successful login', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError('Previous error');
      });

      expect(result.current.error).toBe('Previous error');

      act(() => {
        result.current.setAuth({
          user: { id: '1', email: 'test@example.com', role: 'investigator' },
          token: 'token'
        });
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear auth state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth({
          user: { id: '1', email: 'test@example.com', role: 'investigator' },
          token: 'token'
        });
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth({
          user: { id: '1', email: 'test@example.com', role: 'investigator' },
          token: 'token'
        });
      });

      localStorage.setItem('token', 'token');
      localStorage.setItem('user', JSON.stringify({ id: '1' }));

      act(() => {
        result.current.logout();
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('loading state', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError('Login failed');
      });

      expect(result.current.error).toBe('Login failed');
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError('Error message');
      });

      expect(result.current.error).toBe('Error message');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('permissions', () => {
    it('should check user permissions', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth({
          user: {
            id: '1',
            email: 'admin@example.com',
            role: 'admin',
            permissions: ['read:cases', 'write:cases', 'delete:cases']
          },
          token: 'token'
        });
      });

      expect(result.current.hasPermission('read:cases')).toBe(true);
      expect(result.current.hasPermission('delete:cases')).toBe(true);
      expect(result.current.hasPermission('admin:system')).toBe(false);
    });

    it('should return false when not authenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasPermission('read:cases')).toBe(false);
    });
  });

  describe('role checking', () => {
    it('should check user role', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth({
          user: { id: '1', email: 'investigator@example.com', role: 'investigator' },
          token: 'token'
        });
      });

      expect(result.current.hasRole('investigator')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(false);
    });
  });

  describe('token refresh', () => {
    it('should update token', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuth({
          user: { id: '1', email: 'test@example.com', role: 'investigator' },
          token: 'old-token'
        });
      });

      act(() => {
        result.current.refreshToken('new-token');
      });

      expect(result.current.token).toBe('new-token');
      expect(localStorage.getItem('token')).toBe('new-token');
    });
  });

  describe('reactivity', () => {
    it('should trigger re-render on state change', () => {
      const { result } = renderHook(() => useAuthStore());
      let renderCount = 0;

      const { result: trackedResult } = renderHook(() => {
        renderCount++;
        return useAuthStore((state) => state.user);
      });

      const initialCount = renderCount;

      act(() => {
        result.current.setAuth({
          user: { id: '1', email: 'test@example.com', role: 'investigator' },
          token: 'token'
        });
      });

      expect(renderCount).toBeGreaterThan(initialCount);
    });
  });
});
