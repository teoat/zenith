import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';

// Mock all the hooks and components
jest.mock('../../context/NetworkStatusContext', () => ({
  NetworkStatusContext: {
    Provider: ({ children }: any) => children,
    Consumer: ({ children }: any) => children({ isOnline: true })
  }
}));

jest.mock('../hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: () => ({
    data: null,
    dataUpdatedAt: Date.now(),
    isLoading: false,
    error: null
  })
}));

jest.mock('../components/common/RookieChecklist', () => ({
  __esModule: true,
  default: () => <div data-testid="rookie-checklist" />
}));

jest.mock('../components/common/RookieChecklistWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="rookie-checklist-wrapper" />
}));

jest.mock('../components/common/WelcomeMessage', () => ({
  __esModule: true,
  default: () => <div data-testid="welcome-message" />
}));

jest.mock('../components/dashboard/MovableDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="movable-dashboard" />
}));

jest.mock('../components/PageErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders dashboard components', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('welcome-message')).toBeInTheDocument();
    expect(screen.getByTestId('movable-dashboard')).toBeInTheDocument();
  });

  it('displays rookie checklist for new users', () => {
    // Mock localStorage to return incomplete checklist
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ run_analysis: false }));

    render(<Dashboard />);

    expect(screen.getByTestId('rookie-checklist-wrapper')).toBeInTheDocument();
  });

  it('hides rookie checklist for experienced users', () => {
    // Mock localStorage to return completed checklist
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ run_analysis: true }));

    render(<Dashboard />);

    expect(screen.queryByTestId('rookie-checklist-wrapper')).not.toBeInTheDocument();
  });

  it('handles localStorage errors gracefully', () => {
    // Mock localStorage to throw an error
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    // Should not crash and should show rookie checklist as fallback
    expect(() => {
      render(<Dashboard />);
    }).not.toThrow();

    expect(screen.getByTestId('rookie-checklist-wrapper')).toBeInTheDocument();
  });

  it('updates current time on mount', () => {
    const setTimeoutSpy = jest.spyOn(window, 'setTimeout');

    render(<Dashboard />);

    // Should set up interval for time updates
    expect(setTimeoutSpy).toHaveBeenCalled();
  });

  it('handles network reconnection', () => {
    const { rerender } = render(<Dashboard />);

    // Initially online
    expect(screen.getByText(/System Operational/)).toBeInTheDocument();

    // Simulate going offline and back online
    const { useNetworkStatus } = require('../hooks/useNetworkStatus');
    useNetworkStatus.mockReturnValue({ isOnline: false });
    rerender(<Dashboard />);

    expect(screen.getByText(/Offline Mode/)).toBeInTheDocument();
  });

  it('displays loading state when metrics are loading', () => {
    const { useDashboardMetrics } = require('../hooks/useDashboardMetrics');
    useDashboardMetrics.mockReturnValue({
      data: null,
      dataUpdatedAt: Date.now(),
      isLoading: true,
      error: null
    });

    render(<Dashboard />);

    // Should still render normally since loading is handled by MovableDashboard
    expect(screen.getByTestId('movable-dashboard')).toBeInTheDocument();
  });

  it('handles dashboard metrics errors', () => {
    const { useDashboardMetrics } = require('../hooks/useDashboardMetrics');
    useDashboardMetrics.mockReturnValue({
      data: null,
      dataUpdatedAt: Date.now(),
      isLoading: false,
      error: new Error('Metrics error')
    });

    render(<Dashboard />);

    // Should still render normally since error is handled by MovableDashboard
    expect(screen.getByTestId('movable-dashboard')).toBeInTheDocument();
  });

  it('renders with proper accessibility attributes', () => {
    render(<Dashboard />);

    // Check for main heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Dashboard');
  });

  it('cleans up intervals on unmount', () => {
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

    const { unmount } = render(<Dashboard />);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('shows reconnection notification when coming back online', () => {
    // Start offline
    const { useNetworkStatus } = require('../hooks/useNetworkStatus');
    useNetworkStatus.mockReturnValue({ isOnline: false });

    const { rerender } = render(<Dashboard />);

    expect(screen.getByText(/Offline Mode/)).toBeInTheDocument();

    // Come back online
    useNetworkStatus.mockReturnValue({ isOnline: true });
    rerender(<Dashboard />);

    expect(screen.getByText(/System Operational/)).toBeInTheDocument();

    // Check for reconnection notification (this would be handled by a toast or similar)
    // The implementation shows reconnection state but the actual notification
    // would be handled by a separate component
  });
});