import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, jest, beforeEach } from '@jest/globals';
import { useAuth } from '@/useAuth';

// Mock authService
jest.mock('../../services/auth', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshToken: jest.fn(),
    register: jest.fn()
  }
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should load user from storage if token exists', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'investigator'
      };

      localStorage.setItem('token', 'valid-token');
      const { authService } = await import('../../services/auth');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle missing token on init', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'investigator'
      };

      const mockLoginResponse = {
        access_token: 'new-token',
        user: mockUser
      };

      const { authService } = await import('../../services/auth');
      (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle login failure', async () => {
      const { authService } = await import('../../services/auth');
      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.login('wrong@example.com', 'wrongpass')
        ).rejects.toThrow();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should set loading state during login', async () => {
      const { authService } = await import('../../services/auth');
      let resolveLogin: any;
      (authService.login as jest.Mock).mockReturnValue(
        new Promise((resolve) => { resolveLogin = resolve; })
      );

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login('test@example.com', 'password');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin({ access_token: 'token', user: { id: '1' } });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('logout', () => {
    it('should logout and clear user state', async () => {
      const { authService } = await import('../../services/auth');
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      // Setup logged in state
      act(() => {
        (result.current as any).setUser({ id: '1', email: 'test@example.com' });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should handle logout errors gracefully', async () => {
      const { authService } = await import('../../services/auth');
      (authService.logout as jest.Mock).mockRejectedValue(
        new Error('Logout failed')
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear local state even if API fails
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'newuser@example.com',
        role: 'investigator'
      };

      const { authService } = await import('../../services/auth');
      (authService.register as jest.Mock).mockResolvedValue({
        access_token: 'token',
        user: mockUser
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'securepass',
          fullName: 'New User'
        });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle registration errors', async () => {
      const { authService } = await import('../../services/auth');
      (authService.register as jest.Mock).mockRejectedValue(
        new Error('Email already exists')
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.register({
            email: 'existing@example.com',
            password: 'pass',
            fullName: 'User'
          })
        ).rejects.toThrow();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('token refresh', () => {
    it('should refresh token automatically before expiry', async () => {
      jest.useFakeTimers();

      const { authService } = await import('../../services/auth');
      (authService.refreshToken as jest.Mock).mockResolvedValue({
        access_token: 'refreshed-token'
      });

      const mockUser = { id: '1', email: 'test@example.com', role: 'investigator' };
      localStorage.setItem('token', 'expiring-token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      renderHook(() => useAuth());

      // Fast-forward time to trigger refresh
      await act(async () => {
        jest.advanceTimersByTime(14 * 60 * 1000); // 14 minutes
      });

      await waitFor(() => {
        expect(authService.refreshToken).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it('should handle refresh token failure', async () => {
      jest.useFakeTimers();

      const { authService } = await import('../../services/auth');
      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new Error('Refresh failed')
      );

      const mockUser = { id: '1', email: 'test@example.com', role: 'investigator' };
      localStorage.setItem('token', 'token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        jest.advanceTimersByTime(15 * 60 * 1000);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      jest.useRealTimers();
    });
  });

  describe('permissions', () => {
    it('should check user permissions correctly', async () => {
      const mockUser = {
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['read:cases', 'write:cases', 'delete:cases']
      };

      const { authService } = await import('../../services/auth');
      localStorage.setItem('token', 'token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.hasPermission('read:cases')).toBe(true);
      expect(result.current.hasPermission('delete:users')).toBe(false);
    });

    it('should check roles correctly', async () => {
      const mockUser = {
        id: '1',
        email: 'investigator@example.com',
        role: 'investigator'
      };

      const { authService } = await import('../../services/auth');
      localStorage.setItem('token', 'token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      expect(result.current.hasRole('investigator')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const { authService } = await import('../../services/auth');
      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.login('test@example.com', 'password')
        ).rejects.toThrow('Network error');
      });

      expect(result.current.error).toContain('Network error');
    });

    it('should clear error on successful action', async () => {
      const { authService } = await import('../../services/auth');
      
      // First, cause an error
      (authService.login as jest.Mock).mockRejectedValueOnce(
        new Error('Login failed')
      );

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(
          result.current.login('test@example.com', 'wrong')
        ).rejects.toThrow();
      });

      expect(result.current.error).toBeTruthy();

      // Then, succeed
      (authService.login as jest.Mock).mockResolvedValueOnce({
        access_token: 'token',
        user: { id: '1', email: 'test@example.com' }
      });

      await act(async () => {
        await result.current.login('test@example.com', 'correct');
      });

      expect(result.current.error).toBeNull();
    });
  });
});
