import { describe, it, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '@/authStore';

// Mock authService
jest.mock('../../services/auth', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    getCurrentUser: jest.fn(),
  }
}));

import { authService } from '@/services/auth';

describe('authStore (Cookie-based)', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('should set user on successful login', async () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'ANALYST', full_name: 'Test User' };
      (authService.login as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.user).toEqual({
        id: '1',
        email: 'test@example.com',
        role: 'ANALYST',
        fullName: 'Test User',
        avatar: undefined
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set error on failed login', async () => {
      (authService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrong');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear auth state', async () => {
      // First set authenticated state
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', role: 'ANALYST' },
        isAuthenticated: true
      });

      (authService.logout as jest.Mock).mockResolvedValue({ message: 'Logged out' });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear state even if API fails', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', role: 'ANALYST' },
        isAuthenticated: true
      });

      (authService.logout as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('checkSession', () => {
    it('should set user if session is valid', async () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'ANALYST' };
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkSession();
      });

      expect(result.current.user?.id).toBe('1');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should not set user if session is invalid', async () => {
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkSession();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should clear error', () => {
      useAuthStore.setState({ error: 'Some error' });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should set user directly', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({ id: '2', email: 'new@example.com', role: 'ADMIN' });
      });

      expect(result.current.user?.id).toBe('2');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
