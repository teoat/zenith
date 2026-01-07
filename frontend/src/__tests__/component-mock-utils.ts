import React from "react";

type MockProps = Record<string, unknown>;

// Comprehensive mock utilities for component testing

// Mock external libraries
jest.mock("react-grid-layout", () => ({
  ResponsiveGridLayout: ({ children, ...props }: MockProps) =>
    React.createElement(
      "div",
      { "data-testid": "grid-layout", ...props },
      children,
    ),
}));

jest.mock("react-force-graph-2d", () => ({
  __esModule: true,
  default: React.forwardRef((props, ref) =>
    React.createElement(
      "div",
      { ref, "data-testid": "force-graph", ...props },
      "Force Graph",
    ),
  ),
}));

// Mock React.lazy to render components immediately
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  Suspense: ({ children, fallback }: MockProps) => fallback || children,
  lazy: (_importFn: () => Promise<unknown>) => {
    const LazyComponent = (props: MockProps) =>
      React.createElement(
        "div",
        { "data-testid": "lazy-component", ...props },
        "Lazy Component",
      );
    LazyComponent.displayName = "LazyComponent";
    return LazyComponent;
  },
}));

// Common component mocks
export const createComponentMocks = () => {
  // Dashboard components
  jest.mock("../components/dashboard/ThreatMap", () => ({
    __esModule: true,
    default: (props: MockProps) =>
      React.createElement(
        "div",
        { "data-testid": "threat-map", ...props },
        "Threat Map",
      ),
  }));

  jest.mock("../components/dashboard/AIWatchtower", () => ({
    __esModule: true,
    default: (props: MockProps) =>
      React.createElement(
        "div",
        { "data-testid": "ai-watchtower", ...props },
        "AI Watchtower",
      ),
  }));

  jest.mock("../components/dashboard/LiveQueue", () => ({
    __esModule: true,
    default: (props: MockProps) =>
      React.createElement(
        "div",
        { "data-testid": "live-queue", ...props },
        "Live Queue",
      ),
  }));

  jest.mock("../components/dashboard/VolumeChart", () => ({
    __esModule: true,
    default: (props: MockProps) =>
      React.createElement(
        "div",
        { "data-testid": "volume-chart", ...props },
        "Volume Chart",
      ),
  }));

  jest.mock("../components/dashboard/RiskDistributionChart", () => ({
    __esModule: true,
    default: (props: MockProps) =>
      React.createElement(
        "div",
        { "data-testid": "risk-chart", ...props },
        "Risk Chart",
      ),
  }));

  jest.mock("../components/dashboard/ProofVisualizationCard", () => ({
    __esModule: true,
    default: (props: MockProps) =>
      React.createElement(
        "div",
        { "data-testid": "proof-viz", ...props },
        "Proof Visualization",
      ),
  }));

  jest.mock("../components/dashboard/CostOptimizationWidget", () => ({
    __esModule: true,
    default: (props: MockProps) =>
      React.createElement(
        "div",
        { "data-testid": "cost-widget", ...props },
        "Cost Widget",
      ),
  }));

  // Mock other components
  jest.mock("../components/common/RookieChecklist", () => ({
    __esModule: true,
    default: (props: MockProps) =>
      React.createElement(
        "div",
        { "data-testid": "rookie-checklist", ...props },
        "Rookie Checklist",
      ),
  }));

  jest.mock("../components/common/WelcomeMessage", () => ({
    __esModule: true,
    default: (props: MockProps) =>
      React.createElement(
        "div",
        { "data-testid": "welcome-message", ...props },
        "Welcome Message",
      ),
  }));

  jest.mock("../components/PageErrorBoundary", () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  }));
};

// Store mocks
export const createStoreMocks = () => {
  jest.mock("../store/projectStore", () => ({
    useProjectStore: jest.fn(() => ({
      currentProject: { id: "test-project", name: "Test Project" },
      projects: [{ id: "test-project", name: "Test Project" }],
      setCurrentProject: jest.fn(),
    })),
  }));

  jest.mock("../store/useAuthStore", () => ({
    useAuthStore: jest.fn(() => ({
      user: { id: "1", email: "test@example.com" },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
    })),
  }));
};

// Hook mocks
export const createHookMocks = () => {
  jest.mock("../hooks/useAuth", () => ({
    useAuth: jest.fn(() => ({
      user: { id: "1", email: "test@example.com" },
      login: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: true,
    })),
  }));

  jest.mock("../hooks/useNetworkStatus", () => ({
    useNetworkStatus: jest.fn(() => ({
      isOnline: true,
      connectionType: "wifi",
    })),
  }));

  jest.mock("../hooks/useDashboardMetrics", () => ({
    useDashboardMetrics: jest.fn(() => ({
      data: {
        totalCases: 150,
        activeCases: 45,
        resolvedCases: 105,
        criticalCases: 12,
      },
      dataUpdatedAt: Date.now(),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })),
  }));

  jest.mock("react-i18next", () => ({
    useTranslation: jest.fn(() => ({
      t: jest.fn((key: string) => key),
      i18n: { language: "en" },
    })),
  }));
};

// Utility to set up all mocks for a component test
export const setupComponentTest = () => {
  createComponentMocks();
  createStoreMocks();
  createHookMocks();
};
