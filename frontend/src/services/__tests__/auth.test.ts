import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { authService } from '../auth';

// Mock the request function from client.ts to bypass circuit breaker complexity
jest.mock('../client', () => ({
  request: jest.fn(),
}));

import { request } from '../client';
const mockRequest = request as jest.MockedFunction<typeof request>;

/**
 * Auth Service Tests (Cookie-Based)
 * 
 * These tests verify the auth service behavior by mocking the underlying
 * request function. Cookie handling is done by the backend, not tested here.
 */
describe('AuthService (Cookie-Based)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        id: '1',
        email: 'test@example.com',
        role: 'investigator',
        full_name: 'Test User'
      };

      mockRequest.mockResolvedValueOnce(mockResponse);

      const result = await authService.login({ email: 'test@example.com', password: 'password' });

      expect(result).toEqual(mockResponse);
      expect(mockRequest).toHaveBeenCalledWith('/auth/login', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('should handle login failure', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(
        authService.login({ email: 'wrong@example.com', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        authService.login({ email: 'test@example.com', password: 'password' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      mockRequest.mockResolvedValueOnce({ message: 'Logged out' });

      const result = await authService.logout();

      expect(result).toEqual({ message: 'Logged out' });
      expect(mockRequest).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('should return success even if API fails', async () => {
      mockRequest.mockRejectedValueOnce(new Error('API error'));

      const result = await authService.logout();

      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getCurrentUser', () => {
    it('should retrieve current user from session', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'investigator'
      };

      mockRequest.mockResolvedValueOnce(mockUser);

      const user = await authService.getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(mockRequest).toHaveBeenCalledWith('/auth/me');
    });

    it('should return null on error', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Unauthorized'));

      const user = await authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token via backend', async () => {
      const mockResponse = { access_token: 'new-token' };
      mockRequest.mockResolvedValueOnce(mockResponse);

      const result = await authService.refreshToken();

      expect(result).toEqual(mockResponse);
      expect(mockRequest).toHaveBeenCalledWith('/auth/refresh', expect.objectContaining({
        method: 'POST'
      }));
    });

    it('should handle refresh failure', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Refresh failed'));

      await expect(authService.refreshToken()).rejects.toThrow('Refresh failed');
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const mockResponse = { message: 'User registered' };
      mockRequest.mockResolvedValueOnce(mockResponse);

      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'securepassword',
        fullName: 'New User'
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle registration failures', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Email already exists'));

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password',
          fullName: 'Existing User'
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      mockRequest.mockResolvedValueOnce({ valid: true });

      const isValid = await authService.validateToken('valid-token');
      expect(isValid).toBe(true);
    });

    it('should return false for invalid token', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Invalid'));

      const isValid = await authService.validateToken('expired-token');
      expect(isValid).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      mockRequest.mockResolvedValueOnce({ message: 'Reset email sent' });

      await expect(
        authService.resetPassword('user@example.com')
      ).resolves.toEqual({ message: 'Reset email sent' });
    });

    it('should handle non-existent email', async () => {
      mockRequest.mockRejectedValueOnce(new Error('User not found'));

      await expect(
        authService.resetPassword('nonexistent@example.com')
      ).rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockRequest.mockResolvedValueOnce({ message: 'Password changed' });

      await expect(
        authService.changePassword('oldpassword', 'newpassword')
      ).resolves.toEqual({ message: 'Password changed' });
    });

    it('should reject incorrect old password', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Incorrect password'));

      await expect(
        authService.changePassword('wrongpassword', 'newpassword')
      ).rejects.toThrow('Incorrect password');
    });
  });
});
