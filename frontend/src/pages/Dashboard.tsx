// pages/Dashboard.tsx
import React, { memo } from 'react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

// New Components
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import RookieChecklist from '../components/common/RookieChecklist';
import WelcomeMessage from '../components/common/WelcomeMessage';
import MovableDashboard from '../components/dashboard/MovableDashboard';

// Wrapper component to handle localStorage check outside of render
const RookieChecklistWrapper = memo(() => {
  const isNewUser = React.useMemo(() => {
    try {
      const checklistProgress = localStorage.getItem('rookieChecklist');
      return !checklistProgress || !JSON.parse(checklistProgress || '{}').run_analysis;
    } catch {
      return true;
    }
  }, []);

  if (!isNewUser) return null;
  
  return (
    <div className="mb-6">
      <RookieChecklist />
    </div>
  );
});

RookieChecklistWrapper.displayName = 'RookieChecklistWrapper';

const Dashboard: React.FC = () => {
  // Use React Query hook
  const { data: metrics, isLoading, error } = useDashboardMetrics();

  const getSystemStatus = () => {
      const health = metrics?.systemHealth || 0;
      if (health > 90) return { label: 'System Operational', color: 'bg-green-500', text: 'text-slate-600 dark:text-slate-300' };
      if (health > 70) return { label: 'Degraded Performance', color: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' };
      return { label: 'System Critical', color: 'bg-red-500', text: 'text-red-700 dark:text-red-400' };
  };

  const status = getSystemStatus();

  if (isLoading) return <div className="p-6"><LoadingState text="Loading Intelligence Dashboard..." /></div>;
  if (error) return <div className="p-6"><ErrorMessage error={error.message} /></div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-6" data-tour="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Command Center</h1>
          <p className="text-slate-500 text-sm">Real-time fraud monitoring & intelligence</p>
        </div>
        <div className="flex gap-2">
          <span className={`flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-medium ${status.text}`}>
            <span className={`w-2 h-2 rounded-full ${status.color} animate-pulse`}></span>
            {status.label}
          </span>
        </div>
      </header>

      {/* Rookie Checklist for new users - using stable check */}
      <RookieChecklistWrapper />

      {/* Movable Dashboard Grid */}
      <MovableDashboard />

      <WelcomeMessage />
    </div>
  );
};

export default Dashboard;