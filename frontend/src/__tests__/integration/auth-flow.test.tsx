import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../services/auth');
jest.mock('../../services/cases');
jest.mock('../../services/evidence');

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('complete login flow', () => {
    it('should login and navigate to dashboard', async () => {
      const { authService } = await import('../../services/auth');
      const { caseService } = await import('../../services/cases');

      (authService.login as jest.Mock).mockResolvedValue({
        access_token: 'token',
        user: { id: '1', email: 'test@example.com', role: 'investigator' }
      });
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      const App = (await import('../../App')).default;

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Should start at login
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      // Fill login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Should navigate to dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show error on invalid credentials', async () => {
      const { authService } = await import('../../services/auth');

      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      const Login = (await import('../../pages/Login')).default;

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'wrong@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpass' }
      });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('protected routes', () => {
    it('should redirect to login when not authenticated', async () => {
      const Dashboard = (await import('../../pages/Dashboard')).default;

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should redirect to login
        expect(window.location.pathname).toBe('/login');
      });
    });

    it('should allow access when authenticated', async () => {
      const { authService } = await import('../../services/auth');
      const { caseService } = await import('../../services/cases');

      localStorage.setItem('token', 'valid-token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: 'investigator'
      });
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      const Dashboard = (await import('../../pages/Dashboard')).default;

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('session persistence', () => {
    it('should restore session on page reload', async () => {
      const { authService } = await import('../../services/auth');

      localStorage.setItem('token', 'stored-token');
      (authService.getCurrentUser as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: 'investigator'
      });

      const App = (await import('../../App')).default;

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(authService.getCurrentUser).toHaveBeenCalled();
      });
    });

    it('should handle expired token', async () => {
      const { authService } = await import('../../services/auth');

      localStorage.setItem('token', 'expired-token');
      (authService.getCurrentUser as jest.Mock).mockRejectedValue(
        new Error('Token expired')
      );

      const App = (await import('../../App')).default;

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
      });
    });
  });
});
