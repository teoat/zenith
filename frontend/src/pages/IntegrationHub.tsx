import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Globe,
  Plus,
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  Server,
  Cloud,
  Zap,
  TrendingUp
} from 'lucide-react';
import { api, Integration, IntegrationMetrics } from '@/lib/api';

// Sub-components
import { IntegrationOverview } from '@/components/features/integration-hub/IntegrationOverview';
import { IntegrationList } from '@/components/features/integration-hub/IntegrationList';
import { IntegrationMarketplace } from '@/components/features/integration-hub/IntegrationMarketplace';
import { FederationView } from '@/components/features/integration-hub/FederationView';
import { EventBusView } from '@/components/features/integration-hub/EventBusView';
import { IntegrationAnalytics } from '@/components/features/integration-hub/IntegrationAnalytics';

const IntegrationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'integrations' | 'marketplace' | 'graphql' | 'events' | 'analytics'>('overview');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [metrics, setMetrics] = useState<IntegrationMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = async () => {
    try {
      setLoading(true);
      // Fetch real data (or mocked service data) via API facade
      const [integrationsData, metricsData] = await Promise.all([
         api.getIntegrations(),
         api.getIntegrationMetrics()
      ]);

      setIntegrations(integrationsData);
      setMetrics(metricsData);
    } catch (err) {
      console.error('Failed to load integration data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="integration-hub-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-slate-600">Loading Integration Hub...</p>
      </div>
    );
  }

  return (
    <div className="integration-hub">
      {/* Header */}
      <div className="hub-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Globe className="w-8 h-8 text-blue-600 mr-3" />
              Integration Hub
            </h1>
            <p className="text-slate-600 mt-1">
              Connect and manage third-party integrations and APIs
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="metrics-overview">
          <div className="metric-card">
            <div className="metric-icon">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.totalIntegrations}</div>
              <div className="metric-label">Total Integrations</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.activeIntegrations}</div>
              <div className="metric-label">Active</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{(metrics.successRate * 100).toFixed(1)}%</div>
              <div className="metric-label">Success Rate</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.averageLatency}ms</div>
              <div className="metric-label">Avg Latency</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="hub-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'integrations', label: 'Integrations', icon: Server },
          { id: 'marketplace', label: 'API Marketplace', icon: Cloud },
          { id: 'graphql', label: 'GraphQL Federation', icon: Zap },
          { id: 'events', label: 'Event Bus', icon: Activity },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && <IntegrationOverview />}
        {activeTab === 'integrations' && <IntegrationList integrations={integrations} />}
        {activeTab === 'marketplace' && <IntegrationMarketplace />}
        {activeTab === 'graphql' && <FederationView />}
        {activeTab === 'events' && <EventBusView />}
        {activeTab === 'analytics' && <IntegrationAnalytics integrations={integrations} />}
      </AnimatePresence>
    </div>
  );
};

export default IntegrationHub;