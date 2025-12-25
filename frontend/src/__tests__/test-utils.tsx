import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { AIProvider } from '../context/AIContext';
import { LocaleProvider } from '../providers/LocaleProvider';
import { ToastProvider } from '../providers/ToastProvider';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { NetworkStatusProvider } from '../providers/NetworkStatusProvider';

/**
 * Create a test QueryClient with disabled retries for faster tests
 */
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: MemoryRouterProps['initialEntries'];
  queryClient?: QueryClient;
}

/**
 * Test utility that renders components with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <NetworkStatusProvider>
            <LocaleProvider>
              <ToastProvider>
                <AIProvider>
                  <AccessibilityProvider>
                    <React.Suspense fallback={<div>Loading...</div>}>
                      {children}
                    </React.Suspense>
                  </AccessibilityProvider>
                </AIProvider>
              </ToastProvider>
            </LocaleProvider>
          </NetworkStatusProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Render with only QueryClient provider (no router)
 */
export function renderWithQueryClient(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: Omit<ExtendedRenderOptions, 'initialEntries'> = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
