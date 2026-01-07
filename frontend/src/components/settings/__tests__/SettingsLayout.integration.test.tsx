import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsLayout from '@/SettingsLayout';
import { useSettings } from '@/hooks/useSettings';

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

// Mock the lazy-loaded components
jest.mock('../GeneralSettings', () => ({
  __esModule: true,
  default: ({ settings }: { settings: any }) => React.createElement('div', null,
    React.createElement('input', { value: settings?.theme || 'dark' }),
    React.createElement('input', { value: settings?.language || 'en' }),
    'General Settings'
  )
}));

jest.mock('../NotificationSettings', () => ({
  __esModule: true,
  default: () => React.createElement('div', null, 'Notification Settings')
}));

jest.mock('../SecuritySettings', () => ({
  __esModule: true,
  default: () => React.createElement('div', null, 'Security Settings')
}));

jest.mock('../AccessibilitySettings', () => ({
  __esModule: true,
  default: () => React.createElement('div', null, 'Accessibility Settings')
}));

jest.mock('../SystemSettings', () => ({
  __esModule: true,
  default: () => React.createElement('div', null, 'System Settings')
}));

jest.mock('../RuleBuilder', () => ({
  __esModule: true,
  default: () => React.createElement('div', null, 'Rule Builder')
}));

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

    const retryButton = screen.getByRole('button', { name: /try again/i });
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

    // Since lazy components are mocked, no loading state is shown
    // The component should render successfully
    await waitFor(() => {
      expect(screen.getByText('Security Settings')).toBeInTheDocument();
    });
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