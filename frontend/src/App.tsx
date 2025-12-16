import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NetworkStatusProvider } from '@/providers/NetworkStatusProvider';
import { OfflineQueueProvider } from '@/providers/OfflineQueueContext';
import { AuthProvider } from '@/providers/AuthProvider';
import { LocaleProvider } from '@/providers/LocaleProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { TourProvider } from '@/context/TourContext';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { WebSocketSync } from '@/components/WebSocketSync';
import { AIProvider } from '@/context/AIContext';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { AccessibilityChecker } from '@/components/accessibility/AccessibilityChecker';
import { AccessibilityProvider } from '@/context/AccessibilityContext';

const queryClient = new QueryClient();

// Lazy load components for better performance with preload hints
const Dashboard = React.lazy(() => import(/* webpackChunkName: "dashboard" */ '@/pages/Dashboard'));
const PerformanceDashboard = React.lazy(() => import(/* webpackChunkName: "performance" */ '@/pages/PerformanceDashboard'));
const Cases = React.lazy(() => import(/* webpackChunkName: "cases" */ '@/pages/Cases'));
const Ingestion = React.lazy(() => import(/* webpackChunkName: "ingestion" */ '@/pages/Ingestion'));
const Forensics = React.lazy(() => import(/* webpackChunkName: "forensics" */ '@/pages/Forensics'));
const AdjudicationQueue = React.lazy(() => import(/* webpackChunkName: "adjudication" */ '@/pages/AdjudicationQueue'));
const Reconciliation = React.lazy(() => import(/* webpackChunkName: "reconciliation" */ '@/pages/Reconciliation'));
const Settings = React.lazy(() => import(/* webpackChunkName: "settings" */ '@/pages/Settings'));
const DesignSystemShowcase = React.lazy(() => import(/* webpackChunkName: "design" */ '@/pages/DesignSystemShowcase'));
const Login = React.lazy(() => import(/* webpackChunkName: "auth" */ '@/pages/Login'));
const Setup = React.lazy(() => import(/* webpackChunkName: "setup" */ '@/pages/Setup'));
const NetworkAnalysis = React.lazy(() => import(/* webpackChunkName: "network" */ '@/pages/NetworkAnalysis'));
const RelationshipGraph = React.lazy(() => import(/* webpackChunkName: "graph" */ '@/components/RelationshipGraph.tsx'));
const Investigation = React.lazy(() => import(/* webpackChunkName: "investigation" */ '@/pages/Investigation'));
const Reporting = React.lazy(() => import(/* webpackChunkName: "reporting" */ '@/pages/Reporting'));
const OnboardingWizard = React.lazy(() => import(/* webpackChunkName: "onboarding" */ '@/components/OnboardingWizard'));
const ProofVisualizationRoute = React.lazy(() => import(/* webpackChunkName: "proof" */ '@/pages/ProofVisualizationRoute'));
const TemporalPlayback = React.lazy(() => import(/* webpackChunkName: "temporal" */ '@/components/TemporalPlayback'));
const CaseProgressBar = React.lazy(() => import(/* webpackChunkName: "progress" */ '@/components/CaseProgressBar'));
const InvestigationNotebook = React.lazy(() => import(/* webpackChunkName: "notebook" */ '@/components/InvestigationNotebook'));
const DigitalDossierGenerator = React.lazy(() => import(/* webpackChunkName: "dossier" */ '@/components/DigitalDossierGenerator'));
const CodeReviewDashboard = React.lazy(() => import(/* webpackChunkName: "code-review" */ '@/components/ai/CodeReviewDashboard'));
const PredictiveMaintenanceDashboard = React.lazy(() => import(/* webpackChunkName: "predictive-maintenance" */ '@/components/ai/PredictiveMaintenanceDashboard'));
const AdvancedComplianceDashboard = React.lazy(() => import(/* webpackChunkName: "advanced-compliance" */ '@/components/ai/AdvancedComplianceDashboard'));
const SystemOrchestrationDashboard = React.lazy(() => import(/* webpackChunkName: "orchestration" */ '@/components/monitoring/SystemOrchestrationDashboard'));
const AgentApprovals = React.lazy(() => import(/* webpackChunkName: "approvals" */ '@/pages/AgentApprovals'));
const AgentDrafts = React.lazy(() => import(/* webpackChunkName: "drafts" */ '@/pages/AgentDrafts'));
const NotFound = React.lazy(() => import(/* webpackChunkName: "not-found" */ '@/pages/NotFound'));

// New compliance components
<<<<<<< Updated upstream
=======
const ComplianceDashboard = React.lazy(() => import(/* webpackChunkName: "compliance-dashboard" */ '@/pages/ComplianceDashboard'));
const ComplianceTraining = React.lazy(() => import(/* webpackChunkName: "compliance-training" */ '@/pages/ComplianceTraining'));
>>>>>>> Stashed changes
const ComplianceMonitoring = React.lazy(() => import(/* webpackChunkName: "compliance-monitoring" */ '@/pages/ComplianceMonitoring'));



import { AppLayout } from '@/components/layout/AppLayout';
import LoadingState from '@/components/LoadingState';
import TourSpotlight from '@/components/common/TourSpotlight';
import { setupGlobalErrorHandlers } from '@/utils/errorHandler';
import antiDebug from '@/utils/antiDebug'; // Import anti-debugging utility
import '@/utils/performanceMonitor'; // Initialize performance monitoring
import '@/utils/webVitals'; // Initialize Web Vitals monitoring
import './App.css';

// Initialize global error handlers
setupGlobalErrorHandlers();

// Initialize anti-debugging only in production
if (process.env.NODE_ENV === 'production') {
  antiDebug();
}

// Register service worker for caching and offline support
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('Service Worker registered successfully:', registration.scope);
      })
      .catch(function(error) {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Enhanced error boundary component
class EnhancedErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Enhanced error reporting
    console.error('Application Error:', error);
    console.error('Error Info:', errorInfo);

    // Send to error tracking service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: true,
        custom_map: {
          component_stack: errorInfo.componentStack
        }
      });
    }

    // Could send to external error tracking service here
    // Example: Sentry, LogRocket, etc.
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-lg w-full bg-white shadow-xl rounded-lg p-8">
      <div className="flex items-center mb-6">
        <div className="flex-shrink-0">
          <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Something went wrong
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            An unexpected error occurred in the application
          </p>
        </div>
      </div>

      <div className="mb-6">
        <details className="bg-gray-50 rounded p-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Error Details
          </summary>
          <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Reload Page
        </button>
        <button
          onClick={() => window.history.back()}
          className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

// ... existing imports ...

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <AccessibilityChecker>
      <EnhancedErrorBoundary>
<<<<<<< Updated upstream
          <WebSocketProvider>
=======
>>>>>>> Stashed changes
          <WebSocketSync />
          <TourSpotlight />
          <Suspense fallback={<LoadingState />}>
            <Routes>
            <Route path="/setup" element={<Setup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<LoadingState />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/cases" element={<Cases />} />
                        <Route path="/cases/:caseId" element={<Cases />} />
                        <Route path="/ingestion" element={<Ingestion />} />
                        <Route path="/forensics" element={<Forensics />} />
                        <Route path="/adjudication" element={<AdjudicationQueue />} />
                        <Route path="/reconciliation" element={<Reconciliation />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/design" element={<DesignSystemShowcase />} />
                        <Route path="/onboarding" element={<OnboardingWizard />} />
                        <Route path="/proof/:caseId" element={<ProofVisualizationRoute />} />
                        <Route path="/playback" element={<TemporalPlayback />} />
                        <Route path="/case/progress" element={<CaseProgressBar />} />
                        <Route path="/notebook" element={<InvestigationNotebook />} />
                        <Route path="/dossier/:caseId" element={<DigitalDossierGenerator />} />
                        <Route path="/performance" element={<PerformanceDashboard />} />
                        <Route path="/network" element={<NetworkAnalysis />} />
                        <Route path="/graph" element={<RelationshipGraph />} />
                        <Route path="/investigation" element={<Investigation />} />
                        <Route path="/investigation/:caseId" element={<Investigation />} />
                        <Route path="/reporting" element={<Reporting />} />
                        <Route path="/code-review" element={<CodeReviewDashboard />} />
                        <Route path="/predictive-maintenance" element={<PredictiveMaintenanceDashboard />} />
                        <Route path="/advanced-compliance" element={<AdvancedComplianceDashboard />} />
                         <Route path="/orchestration" element={<SystemOrchestrationDashboard />} />
                         <Route path="/approvals" element={<AgentApprovals />} />
                         <Route path="/drafts" element={<AgentDrafts />} />

                         {/* Compliance Routes */}
<<<<<<< Updated upstream
=======
                         <Route path="/compliance" element={<ComplianceDashboard />} />
                         <Route path="/compliance/training" element={<ComplianceTraining />} />
>>>>>>> Stashed changes
                         <Route path="/compliance/monitoring" element={<ComplianceMonitoring />} />

                         <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
<<<<<<< Updated upstream
      </WebSocketProvider>
=======
>>>>>>> Stashed changes
      </EnhancedErrorBoundary>
    </AccessibilityChecker>
  );
};

const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <QueryClientProvider client={queryClient}>
        <NetworkStatusProvider>
          <LocaleProvider>
            <ToastProvider>
              <OfflineQueueProvider>
                <AuthProvider>
                  <TourProvider>
                    <AIProvider>
                      <Router>
                        <AppContent />
                        <AIAssistant />
                      </Router>
                    </AIProvider>
                  </TourProvider>
                </AuthProvider>
              </OfflineQueueProvider>
            </ToastProvider>
          </LocaleProvider>
        </NetworkStatusProvider>
      </QueryClientProvider>
    </AccessibilityProvider>
  );
};

export default App;