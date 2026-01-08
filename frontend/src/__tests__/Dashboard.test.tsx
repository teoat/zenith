
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '@/pages/Dashboard';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

// Mock Hook
jest.mock('@/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: jest.fn()
}));

// Mock Utils to avoid transitive import issues
jest.mock('@/utils/errorHandler', () => ({
  setupGlobalErrorHandlers: jest.fn()
}));
jest.mock('@/utils/performanceMonitor', () => jest.fn());
jest.mock('@/utils/webVitals', () => jest.fn());

// Mock Lazy Components
jest.mock('@/components/dashboard/ThreatMap', () => () => <div data-testid="threat-map">Threat Map</div>);
jest.mock('@/components/dashboard/MetricSparkline', () => () => <div data-testid="sparkline">Sparkline</div>);
jest.mock('@/components/dashboard/VolumeChart', () => () => <div data-testid="volume-chart">Volume Chart</div>);
jest.mock('@/components/dashboard/RiskDistributionChart', () => () => <div data-testid="risk-chart">Risk Chart</div>);

// Mock Child Components
jest.mock('@/components/dashboard/LiveQueue', () => () => <div data-testid="live-queue">Live Queue</div>);
jest.mock('@/components/dashboard/AIWatchtower', () => () => <div data-testid="ai-watchtower">AI Watchtower</div>);
jest.mock('@/components/dashboard/ProofVisualizationCard', () => () => <div data-testid="proof-card">Proof Visualization</div>);
jest.mock('@/components/common/RookieChecklist', () => () => <div data-testid="rookie-checklist">Rookie Checklist</div>);
jest.mock('@/components/common/WelcomeMessage', () => () => <div data-testid="welcome-message">Welcome Message</div>);
jest.mock('@/components/LoadingState', () => () => <div>Loading Dashboard...</div>);
jest.mock('@/components/ErrorMessage', () => ({ error }: { error: string }) => <div>Error: {error}</div>);

describe('Dashboard Page', () => {
    const mockMetrics = {
        totalCases: 150,
        openCases: 45,
        criticalCases: 12,
        activeAnalysts: 8,
        systemHealth: 95,
        sparklineData: {
            totalCases: [10, 20, 30],
            openCases: [5, 5, 10],
            criticalCases: [1, 2, 1],
            analysts: [5, 6, 8]
        },
        riskDistribution: {
            critical: 12,
            high: 20,
            medium: 30,
            low: 38
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders dashboard with metrics', async () => {
        (useDashboardMetrics as jest.Mock).mockReturnValue({
            data: mockMetrics,
            isLoading: false,
            error: null
        });

        render(<Dashboard />);
        
        expect(screen.getByText('Command Center')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument(); // Total Cases
        expect(screen.getByText('45')).toBeInTheDocument(); // Open Cases
        expect(screen.getByText('12')).toBeInTheDocument(); // Critical Alerts
        
        // Check for System Status
        expect(screen.getByText('System Operational')).toBeInTheDocument();
        
        // Lazy loaded components might need wait?
        // But since we mocked them as simple divs, they render immediately if Suspense fallback isn't blocking.
        // Dashboard wraps them in Suspense.
        
        // Wait for charts
        await waitFor(() => {
            expect(screen.getByTestId('threat-map')).toBeInTheDocument();
            expect(screen.getByTestId('volume-chart')).toBeInTheDocument();
        });
    });

    test('shows loading state', () => {
        (useDashboardMetrics as jest.Mock).mockReturnValue({
            data: null,
            isLoading: true,
            error: null
        });

        render(<Dashboard />);
        expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument();
    });

    test('shows error state', () => {
        (useDashboardMetrics as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            error: { message: 'Failed to fetch metrics' }
        });

        render(<Dashboard />);
        expect(screen.getByText('Error: Failed to fetch metrics')).toBeInTheDocument();
    });
});
