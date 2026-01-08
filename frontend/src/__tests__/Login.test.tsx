
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '@/pages/Login';
import { useAuth } from '@/hooks/useAuth';
import { useApiError } from '@/hooks/useApiError';
import { BrowserRouter } from 'react-router-dom';

// Mock Hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/hooks/useApiError', () => ({
  useApiError: jest.fn()
}));

// Mock Navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { from: { pathname: '/' } } })
}));

describe('Login Page', () => {
    const mockLogin = jest.fn();
    const mockClearError = jest.fn();
    const mockHandleError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({ login: mockLogin });
        (useApiError as jest.Mock).mockReturnValue({ 
            error: null, 
            handleError: mockHandleError, 
            clearError: mockClearError 
        });
    });

    test('renders login form', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    test('submits form with credentials', async () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                mfa_code: undefined
            });
        });
    });

    test('redirects on success', async () => {
        mockLogin.mockResolvedValueOnce({});

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
        });
    });

    test('handles MFA challenge', async () => {
        const error = new Error('MFA code required');
        mockLogin.mockRejectedValueOnce(error);

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

         fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/multi-factor authentication is enabled/i)).toBeInTheDocument();
        });

        // Enter MFA code
        fireEvent.change(screen.getByLabelText(/authentication code/i), { target: { value: '123456' } });
        fireEvent.click(screen.getByRole('button', { name: /verify & sign in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                mfa_code: '123456'
            });
        });
    });
});
