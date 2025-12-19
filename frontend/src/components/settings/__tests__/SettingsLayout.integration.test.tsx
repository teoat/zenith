import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsLayout from '../SettingsLayout';
import { useSettings } from '../../../hooks/useSettings';

// Mock the hooks
jest.mock('../../../hooks/useSettings', () => ({
  useSettings: jest.fn(),
  useUpdateSettings: jest.fn(),
}));

jest.mock('../../../hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: jest.fn(() => ({
    metrics: {
      componentName: 'SettingsLayout',
      renderCount: 1,
      averageRenderTime: 25.5,
      slowestRenderTime: 45.2,
      totalRenderTime: 25.5,
      isSlow: false
    }
  }))
}));

// Mock React.lazy for testing
jest.mock('react', () => {
  const React = jest.requireActual('react');
  return {
    ...React,
    lazy: jest.fn(() => jest.fn(() => null)),
    Suspense: ({ children }: { children: any }) => children,
  };
});

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const mockSettings = {
  theme: 'dark',
  notifications: true,
  autoSave: false,
  maxFileSize: 10,
  language: 'en'
};

describe('SettingsLayout Performance & Integration', () => {
  beforeEach(() => {
    (useSettings as jest.Mock).mockReturnValue({
      data: mockSettings,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });
  });

  it('renders with performance monitoring enabled', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsLayout />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('displays loading skeleton while loading', () => {
    (useSettings as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsLayout />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('settings-skeleton')).toBeInTheDocument();
  });

  it('displays error state when request fails', () => {
    const mockError = new Error('Failed to load settings');
    const mockRefetch = jest.fn();

    (useSettings as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
      refetch: mockRefetch
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsLayout />
      </QueryClientProvider>
    );

    expect(screen.getByText('Settings Unavailable')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load settings/)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('switches between tabs correctly', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsLayout />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('General Settings')).toBeInTheDocument();
    });

    const notificationsTab = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(notificationsTab);

    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });
  });

  it('handles tab switching with lazy loading', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsLayout />
      </QueryClientProvider>
    );

    // Should show loading state when switching tabs
    const securityTab = screen.getByRole('button', { name: /security/i });
    fireEvent.click(securityTab);

    // Suspense fallback should be visible briefly
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('maintains accessibility standards', async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsLayout />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    // Check for proper ARIA attributes
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();

    const tabs = screen.getAllByRole('button');
    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  it('integrates with React Query properly', async () => {
    const mockRefetch = jest.fn();
    (useSettings as jest.Mock).mockReturnValue({
      data: mockSettings,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsLayout />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('General Settings')).toBeInTheDocument();
    });

    // Verify data is passed to child components
    expect(screen.getByDisplayValue('dark')).toBeInTheDocument();
    expect(screen.getByDisplayValue('en')).toBeInTheDocument();
  });
});