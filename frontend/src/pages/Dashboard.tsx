import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Shield, CloudOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import RookieChecklist from '@/components/common/RookieChecklist';
import WelcomeMessage from '@/components/common/WelcomeMessage';
import MovableDashboard from '@/components/dashboard/MovableDashboard';
import FeatureDiscovery from '@/components/dashboard/FeatureDiscovery';
import PageErrorBoundary from '@/components/PageErrorBoundary';
import { useQueryClient } from '@tanstack/react-query';

// Wrapper component to handle localStorage check outside of render
const RookieChecklistWrapper = memo(() => {
  const [isNewUser, setIsNewUser] = React.useState(false);

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const { electronStore } = await import('../utils/electronStore');
        const checklistProgress = await electronStore.get<Record<string, boolean>>('rookieChecklist');
        if (!checklistProgress || !checklistProgress.run_analysis) {
          setIsNewUser(true);
        }
      } catch {
        setIsNewUser(true);
      }
    };
    checkUser();
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
  const { t } = useTranslation('dashboard');
  const { isOnline } = useNetworkStatus();
  const { dataUpdatedAt } = useDashboardMetrics();
  const queryClient = useQueryClient();
  const [showReconnected, setShowReconnected] = React.useState(false);
  const wasOffline = React.useRef(!isOnline);
  const [currentTime, setCurrentTime] = React.useState(0);



  React.useEffect(() => {
    setCurrentTime(Date.now());
    const interval = setInterval(() => setCurrentTime(Date.now()), 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (isOnline && wasOffline.current) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 5000);
      return () => clearTimeout(timer);
    }
    wasOffline.current = !isOnline;
  }, [isOnline]);

  const isDataStale = dataUpdatedAt && currentTime > 0 && (currentTime - dataUpdatedAt > 120000); // 2 minutes

  const status = isOnline
    ? { label: t('status.online', 'System Operational'), color: 'bg-green-500', text: 'text-slate-600 dark:text-slate-300' }
    : { label: t('status.offline', 'Offline Mode'), color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Network Status Banners */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CloudOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">{t('messages.offline.title', 'Working Offline')}</h3>
            <p className="text-xs text-amber-700 dark:text-amber-300">{t('messages.offline.description', 'Changes will be synced when connection is restored. Some features may be limited.')}</p>
          </div>
          <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
        </div>
      )}

      {showReconnected && (
        <div className="bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">{t('messages.online.title', 'Back Online')}</h3>
            <p className="text-xs text-green-700 dark:text-green-300">{t('messages.online.description', 'Your connection has been restored. Syncing latest data...')}</p>
          </div>
        </div>
      )}

      {isDataStale && isOnline && (
        <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 p-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-blue-800 dark:text-blue-200 italic">
            {t('messages.staleData', 'Displaying cached data from {{time}}.', { time: new Date(dataUpdatedAt).toLocaleTimeString() })}
          </span>
          <button
            onClick={() => queryClient.invalidateQueries()}
            className="text-xs font-bold text-blue-600 hover:underline ml-auto"
          >
            {t('actions.refresh', 'Refresh Now')}
          </button>
        </div>
      )}

      <header className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Command Center
            </h1>
          </div>
          <p className="text-slate-500 text-sm italic">
            Real-time fraud monitoring & intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-medium shadow-sm transition-all duration-500 ${status.text}`}>
            <span className={`w-2 h-2 rounded-full ${status.color} ${isOnline ? 'animate-pulse' : ''}`}></span>
            {status.label}
          </span>
        </div>
      </header>

      <main className="space-y-6">
        <RookieChecklistWrapper />
        <FeatureDiscovery className="mb-6" maxItems={4} />
        <MovableDashboard />
        <WelcomeMessage />
      </main>
    </div>
  );
};

const DashboardWithErrorBoundary = () => (
  <PageErrorBoundary>
    <Dashboard />
  </PageErrorBoundary>
);

export default DashboardWithErrorBoundary;