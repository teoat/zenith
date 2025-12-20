import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../Dashboard';
import { setupComponentTest } from '../../__tests__/component-mock-utils';

// Set up all component mocks
setupComponentTest();

// Create a query client for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../store/projectStore', () => ({
  useProjectStore: jest.fn(() => ({
    currentProject: { id: 'test-project', name: 'Test Project' },
    projects: [{ id: 'test-project', name: 'Test Project' }],
    setCurrentProject: jest.fn()
  }))
}));

jest.mock('react-grid-layout', () => ({
  ResponsiveGridLayout: ({ children, ...props }: any) => (
    <div data-testid="grid-layout" {...props}>
      {children}
    </div>
  )
}));

// Mock lazy-loaded components with simple components
jest.mock('../../components/dashboard/ThreatMap', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'threat-map' }, 'Threat Map')
}));

jest.mock('../../components/dashboard/AIWatchtower', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'ai-watchtower' }, 'AI Watchtower')
}));

jest.mock('../../components/dashboard/LiveQueue', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'live-queue' }, 'Live Queue')
}));

jest.mock('../../components/dashboard/VolumeChart', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'volume-chart' }, 'Volume Chart')
}));

jest.mock('../../components/dashboard/RiskDistributionChart', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'risk-chart' }, 'Risk Chart')
}));

jest.mock('../../components/dashboard/ProofVisualizationCard', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'proof-viz' }, 'Proof Visualization')
}));

jest.mock('../../components/dashboard/CostOptimizationWidget', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'cost-widget' }, 'Cost Widget')
}));

// Mock Suspense to render children immediately
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  Suspense: ({ children }: { children: React.ReactNode }) => children,
  lazy: (importFn: () => Promise<any>) => {
    const Component = () => React.createElement('div', { 'data-testid': 'lazy-component' }, 'Lazy Component');
    return Component;
  }
}));

// Mock other components
jest.mock('../../components/common/RookieChecklist', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'rookie-checklist' }, 'Rookie Checklist')
}));

jest.mock('../../components/common/WelcomeMessage', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'welcome-message' }, 'Welcome Message')
}));

jest.mock('../../components/PageErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children)
}));

jest.mock('../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => ({
    isOnline: true
  }))
}));

jest.mock('../../hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: jest.fn(() => ({
    data: {
      totalCases: 150,
      activeCases: 45,
      resolvedCases: 105,
      criticalCases: 12
    },
    dataUpdatedAt: Date.now(),
    isLoading: false,
    error: null
  }))
}));

jest.mock('../../context/NetworkStatusContext', () => ({
  NetworkStatusContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (value: any) => React.ReactNode }) => children({ isOnline: true })
  }
}));

jest.mock('../../services/cases', () => ({
  caseService: {
    getAllCases: jest.fn(),
    getCaseStatistics: jest.fn(),
    getCases: jest.fn(),
    getCase: jest.fn(),
    createCase: jest.fn(),
    updateCase: jest.fn(),
    deleteCase: jest.fn(),
    getCaseNotes: jest.fn(),
    addCaseNote: jest.fn(),
    updateCaseNote: jest.fn(),
    deleteCaseNote: jest.fn()
  }
}));

jest.mock('../../lib/api', () => ({
  api: {
    getMetrics: jest.fn()
  }
}));

const renderDashboard = (props = {}) => {
  return render(
    <BrowserRouter>
      <Dashboard {...props} />
    </BrowserRouter>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const { useAuth } = require('../../hooks/useAuth');
    useAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'investigator' },
      isAuthenticated: true
    });
  });

  describe('rendering', () => {
    it('should render dashboard title', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({
        total: 100,
        open: 30,
        in_progress: 45,
        closed: 25
      });
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      const { caseService } = require('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      renderDashboard();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should render statistics cards', async () => {
      const mockStats = {
        total: 150,
        open: 40,
        in_progress: 60,
        closed: 50,
        by_priority: {
          high: 20,
          medium: 80,
          low: 50
        }
      };

      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue(mockStats);
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('40')).toBeInTheDocument();
        expect(screen.getByText('60')).toBeInTheDocument();
      });
    });
  });

  describe('data fetching', () => {
    it('should fetch dashboard data on mount', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      renderDashboard();

      await waitFor(() => {
        expect(caseService.getCaseStatistics).toHaveBeenCalled();
        expect(caseService.getAllCases).toHaveBeenCalled();
      });
    });

    it('should handle data fetch errors gracefully', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockRejectedValue(
        new Error('API error')
      );

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
      });
    });

    it('should refresh data when refresh button clicked', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      renderDashboard();

      await waitFor(() => {
        expect(caseService.getCaseStatistics).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByTestId('refresh-button');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(caseService.getCaseStatistics).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('recent cases section', () => {
    it('should display recent cases', async () => {
      const mockCases = [
        {
          id: '1',
          title: 'Recent Case 1',
          status: 'open',
          priority: 'high',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Recent Case 2',
          status: 'in_progress',
          priority: 'medium',
          created_at: new Date().toISOString()
        }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Recent Case 1')).toBeInTheDocument();
        expect(screen.getByText('Recent Case 2')).toBeInTheDocument();
      });
    });

    it('should limit displayed cases to 5 most recent', async () => {
      const mockCases = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Case ${i + 1}`,
        status: 'open',
        priority: 'medium',
        created_at: new Date(Date.now() - i * 1000).toISOString()
      }));

      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderDashboard();

      await waitFor(() => {
        const caseCards = screen.getAllByTestId(/case-card-/);
        expect(caseCards).toHaveLength(5);
      });
    });

    it('should navigate to case details when case clicked', async () => {
      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      const mockCases = [{
        id: 'case-123',
        title: 'Test Case',
        status: 'open',
        priority: 'high',
        created_at: new Date().toISOString()
      }];

      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderDashboard();

      await waitFor(() => {
        const caseCard = screen.getByTestId('case-card-case-123');
        fireEvent.click(caseCard);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/cases/case-123');
    });
  });

  describe('charts and visualizations', () => {
    it('should render status distribution chart', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({
        open: 30,
        in_progress: 45,
        closed: 25
      });
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('status-chart')).toBeInTheDocument();
      });
    });

    it('should render priority distribution chart', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({
        by_priority: {
          high: 20,
          medium: 50,
          low: 30
        }
      });
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('priority-chart')).toBeInTheDocument();
      });
    });
  });

  describe('filters and controls', () => {
    it('should filter cases by status', async () => {
      const mockCases = [
        { id: '1', title: 'Open Case', status: 'open', priority: 'high', created_at: new Date().toISOString() },
        { id: '2', title: 'Closed Case', status: 'closed', priority: 'low', created_at: new Date().toISOString() }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderDashboard();

      await waitFor(() => {
        const statusFilter = screen.getByTestId('status-filter');
        fireEvent.change(statusFilter, { target: { value: 'open' } });
      });

      expect(screen.getByText('Open Case')).toBeInTheDocument();
      expect(screen.queryByText('Closed Case')).not.toBeInTheDocument();
    });

    it('should sort cases by different criteria', async () => {
      const mockCases = [
        { id: '1', title: 'Case A', status: 'open', priority: 'low', created_at: '2025-01-01T00:00:00Z' },
        { id: '2', title: 'Case B', status: 'open', priority: 'high', created_at: '2025-01-02T00:00:00Z' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderDashboard();

      await waitFor(() => {
        const sortSelect = screen.getByTestId('sort-select');
        fireEvent.change(sortSelect, { target: { value: 'priority' } });
      });

      const caseCards = screen.getAllByTestId(/case-card-/);
      expect(caseCards[0]).toHaveTextContent('Case B'); // High priority first
    });
  });

  describe('quick actions', () => {
    it('should show create case button', () => {
      const { caseService } = require('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      renderDashboard();

      expect(screen.getByTestId('create-case-button')).toBeInTheDocument();
    });

    it('should navigate to create case page when button clicked', async () => {
      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      renderDashboard();

      const createButton = screen.getByTestId('create-case-button');
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/cases/create');
    });
  });

  describe('notifications and alerts', () => {
    it('should display high-priority case alerts', async () => {
      const mockCases = [{
        id: '1',
        title: 'Urgent Case',
        status: 'open',
        priority: 'high',
        created_at: new Date().toISOString(),
        alert: true
      }];

      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('high-priority-alert')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByLabelText(/dashboard navigation/i)).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getCaseStatistics as jest.Mock).mockResolvedValue({});
      (caseService.getAllCases as jest.Mock).mockResolvedValue([{
        id: '1',
        title: 'Test Case',
        status: 'open',
        priority: 'medium',
        created_at: new Date().toISOString()
      }]);

      renderDashboard();

      await waitFor(() => {
        const caseCard = screen.getByTestId('case-card-1');
        caseCard.focus();
        expect(document.activeElement).toBe(caseCard);
      });
    });
  });
});