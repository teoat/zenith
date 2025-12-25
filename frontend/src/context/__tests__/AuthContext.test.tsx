import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('../../services/auth');

const TestComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('provider', () => {
    it('should provide auth context', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    it('should initialize from localStorage', async () => {
      localStorage.setItem('token', 'stored-token');
      
      const { authService } = await import('../../services/auth');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'stored@example.com'
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('stored@example.com');
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const { authService } = await import('../../services/auth');
      (authService.login as jest.Mock).mockResolvedValue({
        access_token: 'token',
        user: { id: '1', email: 'test@example.com' }
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });

    it('should handle login errors', async () => {
const { authService } = await import('../../services/auth');
      (authService.login as jest.Mock).mockRejectedValue(new Error('Login failed'));

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      });
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const { authService } = await import('../../services/auth');
      (authService.login as jest.Mock).mockResolvedValue({
        access_token: 'token',
        user: { id: '1', email: 'test@example.com' }
      });
      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      fireEvent.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      });
    });
  });

  describe('token refresh', () => {
    it('should refresh token periodically', async () => {
      jest.useFakeTimers();

      const { authService } = await import('../../services/auth');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com'
      });
      (authService.refreshToken as jest.Mock).mockResolvedValue({
        access_token: 'new-token'
      });

      localStorage.setItem('token', 'old-token');

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });

      jest.advanceTimersByTime(14 * 60 * 1000); // 14 minutes

      await waitFor(() => {
        expect(authService.refreshToken).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });
});
