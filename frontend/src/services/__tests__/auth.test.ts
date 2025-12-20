import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { authService } from '../auth';

// Mock fetch
global.fetch = jest.fn();

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'investigator'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await authService.login({ email: 'test@example.com', password: 'password' });

      expect(result).toEqual(mockResponse);
      expect(localStorage.getItem('token')).toBe('test-token');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should handle login failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid credentials' })
      });

      await expect(
        authService.login('wrong@example.com', 'wrongpassword')
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Network error');
    });
  });

  describe('logout', () => {
    it('should clear stored token on logout', async () => {
      localStorage.setItem('token', 'test-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should handle logout even if API call fails', async () => {
      localStorage.setItem('token', 'test-token');
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('API error')
      );

      await authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should retrieve current user if token exists', async () => {
      localStorage.setItem('token', 'valid-token');
      
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'investigator'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const user = await authService.getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null if no token', async () => {
      const user = await authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should handle expired token', async () => {
      localStorage.setItem('token', 'expired-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Expired token' })
      });

      await expect(authService.getCurrentUser()).rejects.toThrow();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      localStorage.setItem('token', 'old-token');
      
      const mockResponse = {
        access_token: 'new-token',
        token_type: 'bearer'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await authService.refreshToken();

      expect(result).toEqual(mockResponse);
      expect(localStorage.getItem('token')).toBe('new-token');
    });

    it('should handle refresh token failure', async () => {
      localStorage.setItem('token', 'old-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(authService.refreshToken()).rejects.toThrow();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const mockResponse = {
        id: '1',
        email: 'newuser@example.com',
        role: 'investigator'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'securepassword',
        fullName: 'New User'
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle registration failures', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ detail: 'Email already exists' })
      });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password',
          fullName: 'Existing User'
        })
      ).rejects.toThrow();
    });
  });

  describe('validateToken', () => {
    it('should validate valid token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true })
      });

      const isValid = await authService.validateToken('valid-token');
      expect(isValid).toBe(true);
    });

    it('should invalidate expired token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const isValid = await authService.validateToken('expired-token');
      expect(isValid).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Reset email sent' })
      });

      await expect(
        authService.resetPassword('user@example.com')
      ).resolves.not.toThrow();
    });

    it('should handle non-existent email gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(
        authService.resetPassword('nonexistent@example.com')
      ).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      localStorage.setItem('token', 'valid-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Password changed' })
      });

      await expect(
        authService.changePassword('oldpassword', 'newpassword')
      ).resolves.not.toThrow();
    });

    it('should reject incorrect old password', async () => {
      localStorage.setItem('token', 'valid-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Incorrect password' })
      });

      await expect(
        authService.changePassword('wrongpassword', 'newpassword')
      ).rejects.toThrow();
    });
  });
});
