import React, { useState, Suspense, memo } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import PageErrorBoundary from '../PageErrorBoundary';
import SettingsSkeleton from './SettingsSkeleton';
import SettingsErrorState from './SettingsErrorState';
import SettingsNavigation from './SettingsNavigation';
import SettingsHeader from './SettingsHeader';

// Lazy load tab components for code splitting
const GeneralSettings = React.lazy(() => import('./GeneralSettings'));
const NotificationSettings = React.lazy(() => import('./NotificationSettings'));
const SecuritySettings = React.lazy(() => import('./SecuritySettings'));
const AccessibilitySettings = React.lazy(() => import('./AccessibilitySettings'));
const SystemSettings = React.lazy(() => import('./SystemSettings'));
const RuleBuilder = React.lazy(() => import('./RuleBuilder'));
const CodeEditor = React.lazy(() => import('./GeneralSettings')); // Mocking Monaco for roadmap item

type Tab = 'general' | 'notifications' | 'security' | 'accessibility' | 'system' | 'rules' | 'branding' | 'scripts' | 'abtesting';

const SettingsLayout: React.FC = memo(() => {
  const { data: settings, isLoading, error, refetch } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');

  // Performance monitoring
  const { metrics } = usePerformanceMonitor('SettingsLayout', {
    threshold: 50, // Settings can be slower due to form complexity
    enableLogging: true,
    reportToAnalytics: true
  });

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (error) {
    return <SettingsErrorState error={error} onRetry={refetch} />;
  }
  
  const tabs = [
    { id: 'general' as Tab, label: 'General', component: GeneralSettings },
    { id: 'notifications' as Tab, label: 'Notifications', component: NotificationSettings },
    { id: 'security' as Tab, label: 'Security', component: SecuritySettings },
    { id: 'rules' as Tab, label: 'Rules Engine', component: RuleBuilder },
    { id: 'accessibility' as Tab, label: 'Accessibility', component: AccessibilitySettings },
    { id: 'system' as Tab, label: 'System', component: SystemSettings },
    { id: 'branding' as Tab, label: 'Branding', component: GeneralSettings }, // Roadmap Item: Workspace Customization
    { id: 'scripts' as Tab, label: 'Self-Healing', component: CodeEditor }, // Roadmap Item: Scripting
    { id: 'abtesting' as Tab, label: 'A/B Testing', component: SystemSettings }, // Roadmap Item: Workflow testing
  ];

  const filteredTabs = tabs.filter(tab => 
    tab.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  // Development-only performance logging
  if (process.env.NODE_ENV === 'development' && metrics.renderCount > 1) {
    const logger = console;
    logger.log(`[PERF] SettingsLayout metrics:`, metrics);
  }

  return (
    <PageErrorBoundary>
      <div className="settings-container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SettingsHeader />
        <div className="relative w-full md:w-64">
            {/* Simple search input using standard HTML or UI component if available */}
            <input
              type="text"
              placeholder="Search settings..."
              className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      <SettingsNavigation
        tabs={filteredTabs.map(tab => ({ id: tab.id, label: tab.label }))}
        activeTab={activeTab}
        onTabChange={(tab: string) => setActiveTab(tab as Tab)}
      />
      <div className="settings-content">
        <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-lg" />}>
          {ActiveComponent && settings && <ActiveComponent settings={settings} />}
        </Suspense>
      </div>

      {/* Development-only performance indicator */}
      {process.env.NODE_ENV === 'development' && metrics.isSlow && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium text-yellow-800">
            ⚠️ Slow Component: SettingsLayout
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Avg: {metrics.averageRenderTime.toFixed(1)}ms |
            Slowest: {metrics.slowestRenderTime.toFixed(1)}ms
          </div>
        </div>
        )}
      </div>
    </PageErrorBoundary>
  );
});

SettingsLayout.displayName = 'SettingsLayout';

export default SettingsLayout;