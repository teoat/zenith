import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, jest, beforeEach } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';
import Login from '@/Login';

jest.mock('../../hooks/useAuth');
jest.mock('../../hooks/useApiError', () => ({
  useApiError: jest.fn(() => ({
    error: null,
    handleError: jest.fn(),
    clearError: jest.fn()
  }))
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render login form', () => {
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({ isAuthenticated: false, login: jest.fn() });

      renderLogin();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should show forgot password link', () => {
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({ isAuthenticated: false, login: jest.fn() });

      renderLogin();

      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('should show register link', () => {
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({ isAuthenticated: false, login: jest.fn() });

      renderLogin();

      expect(screen.getByText(/create account/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should validate email format', async () => {
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({ isAuthenticated: false, login: jest.fn() });

      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('should require password', async () => {
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({ isAuthenticated: false, login: jest.fn() });

      renderLogin();

      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('login flow', () => {
    it('should login with valid credentials', async () => {
      const mockLogin = jest.fn().mockResolvedValue(undefined);
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({ isAuthenticated: false, login: mockLogin });

      renderLogin();

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should show error on failed login', async () => {
      const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({ isAuthenticated: false, login: mockLogin, error: 'Invalid credentials' });

      renderLogin();

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

    it('should show loading state during login', async () => {
      const mockLogin = jest.fn(() => new Promise(() => {})); // Never resolves
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({ isAuthenticated: false, login: mockLogin, isLoading: true });

      renderLogin();

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    });
  });

  describe('navigation', () => {
    it('should redirect to dashboard when authenticated', () => {
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({ isAuthenticated: true, user: { id: '1' } });

      renderLogin();

      // Should redirect, so login form shouldn't be visible
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper form labels', () => {
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({ isAuthenticated: false, login: jest.fn() });

      renderLogin();

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
    });

    it('should support keyboard navigation', () => {
      const { useAuth } = require('../../hooks/useAuth');
      useAuth.mockReturnValue({ isAuthenticated: false, login: jest.fn() });

      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);

      fireEvent.keyDown(emailInput, { key: 'Tab' });
      expect(document.activeElement).toBe(passwordInput);
    });
  });
});
