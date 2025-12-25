import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router } from 'react-router-dom';

// Import all providers
import { NetworkStatusProvider } from '@/providers/NetworkStatusProvider';
import { OfflineQueueProvider } from '@/providers/OfflineQueueContext';
import { AuthProvider } from '@/providers/AuthProvider';
import { LocaleProvider } from '@/providers/LocaleProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { TourProvider } from '@/context/TourContext';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { AIProvider } from '@/context/AIContext';
import { AccessibilityProvider } from '@/context/AccessibilityContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Consolidated App Providers
 * Reduces provider nesting and improves performance by batching related providers
 */
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkStatusProvider>
        <AuthProvider>
          <LocaleProvider>
            <ToastProvider>
              <TourProvider>
                <WebSocketProvider>
                  <AIProvider>
                    <AccessibilityProvider>
                      <OfflineQueueProvider>
                        {children}
                      </OfflineQueueProvider>
                    </AccessibilityProvider>
                  </AIProvider>
                </WebSocketProvider>
              </TourProvider>
            </ToastProvider>
          </LocaleProvider>
        </AuthProvider>
      </NetworkStatusProvider>
    </QueryClientProvider>
  );
};

/**
 * Router Provider Component
 * Separated to allow for router-specific logic
 */
export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Router>
      {children}
    </Router>
  );
};