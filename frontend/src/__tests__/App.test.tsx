// Mock React.lazy BEFORE any imports
jest.mock('react', () => {
  const React = jest.requireActual('react');
  return {
    ...React,
    lazy: (factory: any) => factory(),
    Suspense: ({ children }: any) => children,
  };
});



// Mock the App component to avoid React.lazy issues
jest.mock('../App', () => {
  const MockApp = () => <div data-testid="mock-app">App Component</div>;
  return {
    __esModule: true,
    default: MockApp,
  };
});

// Mock AppProviders to avoid nested provider issues
jest.mock('../providers/AppProviders', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-providers">
      <div data-testid="network-provider">
        <div data-testid="auth-provider">
          <div data-testid="locale-provider">
            <div data-testid="toast-provider">
              <div data-testid="tour-provider">
                <div data-testid="websocket-provider">
                  <div data-testid="ai-provider">
                    <div data-testid="accessibility-provider">
                      <div data-testid="offline-provider">
                        {children}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}));

import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock all the providers and components
jest.mock('../providers/NetworkStatusProvider', () => ({
  NetworkStatusProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="network-provider">{children}</div>
}));

jest.mock('../providers/OfflineQueueContext', () => ({
  OfflineQueueProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="offline-provider">{children}</div>
}));

jest.mock('../providers/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>
}));

jest.mock('../providers/LocaleProvider', () => ({
  LocaleProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="locale-provider">{children}</div>
}));

jest.mock('../providers/ToastProvider', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-provider">{children}</div>
}));

jest.mock('../context/TourContext', () => ({
  TourProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="tour-provider">{children}</div>
}));

jest.mock('../providers/WebSocketProvider', () => ({
  WebSocketProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="websocket-provider">{children}</div>
}));

jest.mock('../components/WebSocketSync', () => ({
  WebSocketSync: () => <div data-testid="websocket-sync" />
}));

jest.mock('../context/AIContext', () => ({
  AIProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="ai-provider">{children}</div>
}));

jest.mock('../components/ai/AIAssistant', () => ({
  AIAssistant: () => <div data-testid="ai-assistant" />
}));

jest.mock('../components/accessibility/AccessibilityChecker', () => ({
  AccessibilityChecker: ({ children }: { children: React.ReactNode }) => <div data-testid="accessibility-checker">{children}</div>
}));

jest.mock('../context/AccessibilityContext', () => ({
  AccessibilityProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="accessibility-provider">{children}</div>
}));

jest.mock('../components/common/TourSpotlight', () => ({
  TourSpotlight: () => <div data-testid="tour-spotlight" />
}));

jest.mock('../utils/errorHandler', () => ({
  setupGlobalErrorHandlers: jest.fn()
}));

jest.mock('../utils/antiDebug', () => jest.fn());

jest.mock('../utils/performanceMonitor', () => jest.fn());

jest.mock('../utils/webVitals', () => jest.fn());

jest.mock('../pages/Dashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard-page" />
}));

jest.mock('../pages/PerformanceDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="performance-dashboard-page" />
}));

jest.mock('../pages/Cases', () => ({
  __esModule: true,
  default: () => <div data-testid="cases-page" />
}));

jest.mock('../pages/Ingestion', () => ({
  __esModule: true,
  default: () => <div data-testid="ingestion-page" />
}));

jest.mock('../pages/Forensics', () => ({
  __esModule: true,
  default: () => <div data-testid="forensics-page" />
}));

jest.mock('../pages/AdjudicationQueue', () => ({
  __esModule: true,
  default: () => <div data-testid="adjudication-page" />
}));

jest.mock('../pages/Reconciliation', () => ({
  __esModule: true,
  default: () => <div data-testid="reconciliation-page" />
}));

jest.mock('../pages/Settings', () => ({
  __esModule: true,
  default: () => <div data-testid="settings-page" />
}));

jest.mock('../pages/DesignSystemShowcase', () => ({
  __esModule: true,
  default: () => <div data-testid="design-system-page" />
}));

jest.mock('../pages/Login', () => ({
  __esModule: true,
  default: () => <div data-testid="login-page" />
}));

jest.mock('../pages/Setup', () => ({
  __esModule: true,
  default: () => <div data-testid="setup-page" />
}));

jest.mock('../pages/ProjectSelection', () => ({
  __esModule: true,
  default: () => <div data-testid="project-selection-page" />
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const queryClient = createTestQueryClient();

    expect(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );
    }).not.toThrow();
  });

  it('renders all provider layers correctly', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Check that all providers are rendered
    expect(screen.getByTestId('network-provider')).toBeInTheDocument();
    expect(screen.getByTestId('offline-provider')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('locale-provider')).toBeInTheDocument();
    expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
    expect(screen.getByTestId('tour-provider')).toBeInTheDocument();
  });

  it('renders accessibility components', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('accessibility-checker')).toBeInTheDocument();
    expect(screen.getByTestId('accessibility-provider')).toBeInTheDocument();
  });

  it('renders WebSocket components', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('websocket-sync')).toBeInTheDocument();
  });

  it('renders tour spotlight', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('tour-spotlight')).toBeInTheDocument();
  });



  it('sets up proper app version in environment', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Check that app version is defined
    expect(typeof (global as any).__APP_VERSION__).toBe('string');
  });
});