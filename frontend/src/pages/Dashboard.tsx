// pages/Dashboard.tsx
import React, { memo } from 'react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { Activity, AlertTriangle, FolderOpen, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// New Components
const ThreatMap = React.lazy(() => import('../components/dashboard/ThreatMap'));
import LiveQueue from '../components/dashboard/LiveQueue';
import AIWatchtower from '../components/dashboard/AIWatchtower';
const MetricSparkline = React.lazy(() => import('../components/dashboard/MetricSparkline'));
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import RookieChecklist from '../components/common/RookieChecklist';
import WelcomeMessage from '../components/common/WelcomeMessage';
import ProofVisualizationCard from '../components/dashboard/ProofVisualizationCard';
const VolumeChart = React.lazy(() => import('../components/dashboard/VolumeChart'));
const RiskDistributionChart = React.lazy(() => import('../components/dashboard/RiskDistributionChart'));

// Type definitions
interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: string;
  isCritical?: boolean;
  sparklineData?: number[];
  sparklineColor?: string;
}


// Enhanced KPI Card with Sparkline - Memoized for performance
const KPICard = memo<KPICardProps>(({ 
  title, 
  value, 
  icon, 
  trend, 
  isCritical = false, 
  sparklineData, 
  sparklineColor 
}) => (
  <div className={cn(
    "p-4 rounded-xl border shadow-sm transition-all hover:shadow-md",
    isCritical 
      ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' 
      : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
  )}>
    <div className="flex justify-between items-start mb-2">
      <div className={cn(
        "p-2 rounded-lg",
        isCritical ? 'bg-red-100 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-800'
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-xs font-medium px-2 py-0.5 rounded-full",
        isCritical ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
      )}>
        {trend}
      </span>
    </div>
    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{title}</p>
    {sparklineData && (
      <React.Suspense fallback={<div className="h-8 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />}>
        <MetricSparkline data={sparklineData} color={sparklineColor} height={32} />
      </React.Suspense>
    )}
  </div>
));

KPICard.displayName = 'KPICard';

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

  if (isLoading) return <div className="p-6"><LoadingState text="Loading Intelligence Dashboard..." /></div>;
  if (error) return <div className="p-6"><ErrorMessage error={error.message} /></div>;


  const getSystemStatus = () => {
      const health = metrics?.systemHealth || 0;
      if (health > 90) return { label: 'System Operational', color: 'bg-green-500', text: 'text-slate-600 dark:text-slate-300' };
      if (health > 70) return { label: 'Degraded Performance', color: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' };
      return { label: 'System Critical', color: 'bg-red-500', text: 'text-red-700 dark:text-red-400' };
  };

  const status = getSystemStatus();

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-6" data-tour="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Command Center</h1>
          <p className="text-slate-500 text-sm">Real-time fraud monitoring & intelligence</p>
        </div>
        <div className="flex gap-2">
          <span className={cn(
            "flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-medium",
            status.text
          )}>
            <span className={cn("w-2 h-2 rounded-full animate-pulse", status.color)}></span>
            {status.label}
          </span>
        </div>
      </header>

      {/* Rookie Checklist for new users - using stable check */}
      <RookieChecklistWrapper />

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="metrics-grid">
        <KPICard 
          title="Total Cases" 
          value={metrics?.totalCases || 0} 
          icon={<FolderOpen className="text-blue-500" />} 
          trend=""
          sparklineData={metrics?.sparklineData?.totalCases}
          sparklineColor="#3b82f6"
        />
        <KPICard 
          title="Open Investigations" 
          value={metrics?.openCases || 0} 
          icon={<Activity className="text-amber-500" />} 
          trend=""
          sparklineData={metrics?.sparklineData?.openCases}
          sparklineColor="#f59e0b"
        />
        <KPICard 
          title="Critical Alerts" 
          value={metrics?.criticalCases || 0} 
          icon={<AlertTriangle className="text-red-500" />} 
          isCritical 
          trend=""
          sparklineData={metrics?.sparklineData?.criticalCases}
          sparklineColor="#ef4444"
        />
        <KPICard 
          title="Active Analysts" 
          value={metrics?.activeAnalysts || 0}
          icon={<Users className="text-emerald-500" />} 
          trend=""
          sparklineData={metrics?.sparklineData?.analysts}
          sparklineColor="#10b981"
        />
      </section>

      {/* Main Intelligence Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[500px]">
        {/* Threat Map - Takes up 8 cols */}
        <div className="lg:col-span-8 h-full flex flex-col" data-tour="threat-map">
          <React.Suspense fallback={<div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />}>
            <ThreatMap />
          </React.Suspense>
        </div>

        {/* AI Watchtower - Takes up 4 cols */}
        <div className="lg:col-span-4 h-full flex flex-col gap-6" data-tour="ai-watchtower">
          <AIWatchtower />
          <ProofVisualizationCard caseId="492" />
        </div>
      </section>

      {/* Operational Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        {/* Live Queue - Takes up 1 col */}
        <div className="lg:col-span-1 h-full">
          <LiveQueue />
        </div>

        {/* Volume Trends Chart */}
        <div className="lg:col-span-1 h-full">
          <React.Suspense fallback={<div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />}>
             <VolumeChart data={[
               { date: 'Jan 1', volume: 4000 },
               { date: 'Jan 5', volume: 3000 },
               { date: 'Jan 10', volume: 2000 },
               { date: 'Jan 15', volume: 2780 },
               { date: 'Jan 20', volume: 1890 },
               { date: 'Jan 25', volume: 2390 },
               { date: 'Jan 30', volume: 3490 },
             ]} />
          </React.Suspense>
        </div>

        {/* Risk Distribution Chart */}
        <div className="lg:col-span-1 h-full">
          <React.Suspense fallback={<div className="h-full w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />}>
            <RiskDistributionChart data={[
              { name: 'Critical', value: metrics?.riskDistribution?.critical || 0, color: '#ef4444' }, 
              { name: 'High', value: metrics?.riskDistribution?.high || 0, color: '#f59e0b' },     
              { name: 'Medium', value: metrics?.riskDistribution?.medium || 0, color: '#3b82f6' },   
              { name: 'Low', value: metrics?.riskDistribution?.low || 0, color: '#10b981' },      
            ]} />
          </React.Suspense>
        </div>
      </section>

      <WelcomeMessage />
    </div>
  );
};

export default Dashboard;