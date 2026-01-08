import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Providers
import { AuthenticationProvider } from './providers/AuthenticationProvider';
import { ToastProvider } from './providers/ToastProvider';

// Layout
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoadingState from './components/LoadingState';

// Styles
import './App.css';

// Lazy-loaded Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Cases = lazy(() => import('./pages/Cases'));
const Investigation = lazy(() => import('./pages/Investigation'));
const AgentDrafts = lazy(() => import('./pages/AgentDrafts'));
const AgentApprovals = lazy(() => import('./pages/AgentApprovals'));
const ComplianceMonitoring = lazy(() => import('./pages/ComplianceMonitoring'));
const PerformanceDashboard = lazy(() => import('./pages/PerformanceDashboard'));
const Forensics = lazy(() => import('./pages/Forensics'));
const Ingestion = lazy(() => import('./pages/Ingestion'));
const NetworkAnalysis = lazy(() => import('./pages/NetworkAnalysis'));
const Reconciliation = lazy(() => import('./pages/Reconciliation'));
const IntegrationHub = lazy(() => import('./pages/IntegrationHub'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticationProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingState />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                
                <Route path="/cases/*" element={<ProtectedRoute><AppLayout><Cases /></AppLayout></ProtectedRoute>} />
                <Route path="/investigation/*" element={<ProtectedRoute><AppLayout><Investigation /></AppLayout></ProtectedRoute>} />
                
                <Route path="/agents/drafts" element={<ProtectedRoute><AppLayout><AgentDrafts /></AppLayout></ProtectedRoute>} />
                <Route path="/agents/approvals" element={<ProtectedRoute><AppLayout><AgentApprovals /></AppLayout></ProtectedRoute>} />
                
                <Route path="/compliance" element={<ProtectedRoute><AppLayout><ComplianceMonitoring /></AppLayout></ProtectedRoute>} />
                <Route path="/performance" element={<ProtectedRoute><AppLayout><PerformanceDashboard /></AppLayout></ProtectedRoute>} />
                
                <Route path="/ingestion" element={<ProtectedRoute><AppLayout><Ingestion /></AppLayout></ProtectedRoute>} />
                <Route path="/forensics" element={<ProtectedRoute><AppLayout><Forensics /></AppLayout></ProtectedRoute>} />
                <Route path="/network" element={<ProtectedRoute><AppLayout><NetworkAnalysis /></AppLayout></ProtectedRoute>} />
                <Route path="/reconciliation" element={<ProtectedRoute><AppLayout><Reconciliation /></AppLayout></ProtectedRoute>} />
                <Route path="/integration" element={<ProtectedRoute><AppLayout><IntegrationHub /></AppLayout></ProtectedRoute>} />
                
                <Route path="/settings/*" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthenticationProvider>
    </QueryClientProvider>
  );
};

export default App;