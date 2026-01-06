import { render, screen, fireEvent, waitFor } from '@testing-library/react';


const mockAuthService = {
  login: jest.fn() as any,
  logout: jest.fn() as any,
  getCurrentUser: jest.fn() as any,
  refreshToken: jest.fn() as any,
  register: jest.fn() as any,
  verifyEmail: jest.fn() as any,
  resetPassword: jest.fn() as any,
  changePassword: jest.fn() as any
};

const mockCaseService = {
  getCases: jest.fn() as any,
  getCase: jest.fn() as any,
  createCase: jest.fn() as any,
  updateCase: jest.fn() as any,
  deleteCase: jest.fn() as any,
  getCaseNotes: jest.fn() as any,
  addCaseNote: jest.fn() as any,
  updateCaseNote: jest.fn() as any,
  deleteCaseNote: jest.fn() as any,
  getCaseStatistics: jest.fn() as any,
  bulkUpdateCases: jest.fn() as any,
  getCaseById: jest.fn() as any
};

const mockEvidenceService = {
  getEvidenceByCaseId: jest.fn() as any,
  uploadEvidence: jest.fn() as any,
  deleteEvidence: jest.fn() as any,
  updateEvidence: jest.fn() as any,
  getEvidenceById: jest.fn() as any
};

jest.mock('../../services/auth', () => ({
  authService: mockAuthService
}));

jest.mock('../../services/cases', () => ({
  caseService: mockCaseService
}));

jest.mock('../../services/evidence', () => ({
  evidenceService: mockEvidenceService
}));

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('complete login flow', () => {
    it('should login and navigate to dashboard', async () => {
      mockAuthService.login.mockResolvedValue({
        access_token: 'token',
        user: { id: '1', email: 'test@example.com', role: 'investigator' }
      });
      mockCaseService.getCases.mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0
        }
      });

      const App = (await import('../../App')).default;

      render(<App />);

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
      }, { timeout: 10000 });
    });

    it('should show error on invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(
        new Error('Invalid credentials')
      );

      const Login = (await import('../../pages/Login')).default;
      const { AppProviders } = await import('../../providers/AppProviders');
      const { MemoryRouter } = await import('react-router-dom');

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AppProviders>
            <Login />
          </AppProviders>
        </MemoryRouter>
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
      const { AppProviders } = await import('../../providers/AppProviders');
      const { MemoryRouter } = await import('react-router-dom');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <Dashboard />
          </AppProviders>
        </MemoryRouter>
      );

      await waitFor(() => {
        // Should redirect to login
        expect(window.location.pathname).toBe('/login');
      });
    });

    it('should allow access when authenticated', async () => {
      localStorage.setItem('token', 'valid-token');
      mockAuthService.getCurrentUser.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: 'investigator'
      });
      mockCaseService.getCases.mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0
        }
      });

      const Dashboard = (await import('../../pages/Dashboard')).default;
      const { AppProviders } = await import('../../providers/AppProviders');
      const { MemoryRouter } = await import('react-router-dom');

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppProviders>
            <Dashboard />
          </AppProviders>
        </MemoryRouter>
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

      render(<App />);

      await waitFor(() => {
        expect(authService.getCurrentUser).toHaveBeenCalled();
      });
    });

    it('should handle expired token', async () => {
      localStorage.setItem('token', 'expired-token');
      mockAuthService.getCurrentUser.mockRejectedValue(
        new Error('Token expired')
      );

      const App = (await import('../../App')).default;

      render(<App />);

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
      });
    });
  });
});
