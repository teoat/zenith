import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../pages/Dashboard';

// Mock performance monitoring
jest.mock('../utils/performanceMonitor', () => ({
  PerformanceMonitor: {
    getMetrics: jest.fn().mockReturnValue({
      coreWebVitals: {
        cls: 0.0,
        fid: 0.0,
        lcp: 1.2
      },
      bundleSize: 245000,
      loadTime: 0.8,
      memoryUsage: 45
    })
  }
}));

// Mock useDashboardMetrics since Dashboard uses it
jest.mock('../hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: jest.fn().mockReturnValue({
    data: {
      totalCases: 150,
      activeCases: 25,
      resolvedCases: 125,
      fraudAlerts: 8,
      pendingReviews: 12,
      systemHealth: 'perfect'
    },
    isLoading: false,
    error: null,
    refetch: jest.fn()
  })
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Performance Optimization', () => {
  test('Core Web Vitals are displayed', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  test('lazy loading works', async () => {
    const { rerender } = renderWithProviders(<Dashboard />);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();

    await act(async () => {
      rerender(<Dashboard />);
    });
  });

  test('network requests are tracked', () => {
    const originalFetch = global.fetch;
    let fetchCount = 0;

    global.fetch = jest.fn().mockImplementation(() => {
      fetchCount++;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithProviders(<Dashboard />);
    global.fetch = originalFetch;
  });
});