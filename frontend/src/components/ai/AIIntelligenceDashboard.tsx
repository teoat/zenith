// frontend/src/components/ai/AIIntelligenceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Brain, BarChart3, Network, Zap, RefreshCw, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import { AIMetrics, FederatedNode, ModelVersion } from '@/types/ai-intelligence';
import { AIMetricsGrid } from '../features/ai-intelligence/AIMetricsGrid';
import { OverviewTab } from '../features/ai-intelligence/OverviewTab';
import { FederatedLearningTab } from '../features/ai-intelligence/FederatedLearningTab';
import { RealTimeAdaptationTab } from '../features/ai-intelligence/RealTimeAdaptationTab';
import { MultimodalAnalysisTab } from '../features/ai-intelligence/MultimodalAnalysisTab';
import LoadingState from '../LoadingState';

const AIIntelligenceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'federated' | 'adaptation' | 'multimodal'>('overview');
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [federatedNodes, setFederatedNodes] = useState<FederatedNode[]>([]);
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    if (realTimeEnabled) {
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const loadDashboardData = async () => {
    try {
      // Mock data for demonstration
      setMetrics({
        federatedParticipants: 12,
        activeModels: 3,
        adaptationEvents: 47,
        multimodalAnalyses: 156,
        averageConfidence: 0.89,
        modelAccuracy: 0.94
      });

      setFederatedNodes([
        { id: 'node_001', name: 'Desktop Client A', status: 'active', lastUpdate: '2 min ago', contributionScore: 0.95, dataPoints: 15420 },
        { id: 'node_002', name: 'Web Client B', status: 'training', lastUpdate: '5 min ago', contributionScore: 0.87, dataPoints: 12890 }
      ]);

      setModelVersions([
        { version: 'v2.1.3', accuracy: 0.94, created: '2024-01-15T10:30:00Z', status: 'active', adaptationCount: 23 },
        { version: 'v2.1.2', accuracy: 0.91, created: '2024-01-10T14:20:00Z', status: 'deprecated', adaptationCount: 15 }
      ]);
    } catch (err) {
      console.error('Failed to load AI dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState text="Optimizing Neural Networks..." />;

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-200">
              <Brain className="w-8 h-8" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">AI Intelligence <span className="text-blue-600">Center</span></h1>
              <p className="text-slate-500 font-medium">Advanced AI orchestration and federated learning management</p>
           </div>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className={`p-2 rounded-xl transition-all flex items-center gap-2 ${realTimeEnabled ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${realTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-xs font-black uppercase tracking-wider">{realTimeEnabled ? 'Live Sync' : 'Paused'}</span>
           </div>
           
           <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" onClick={() => setRealTimeEnabled(!realTimeEnabled)} className="h-9 w-9">
               {realTimeEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
             </Button>
             <Button variant="ghost" size="icon" onClick={loadDashboardData} className="h-9 w-9 text-blue-600">
               <RefreshCw className="w-4 h-4" />
             </Button>
           </div>
        </div>
      </div>

      {metrics && <AIMetricsGrid metrics={metrics} />}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'federated', label: 'Federated Learning', icon: Network },
          { id: 'adaptation', label: 'Real-time Adaptation', icon: Zap },
          { id: 'multimodal', label: 'Multi-modal Analysis', icon: Brain }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewTab key="overview" />}
          {activeTab === 'federated' && <FederatedLearningTab key="federated" nodes={federatedNodes} />}
          {activeTab === 'adaptation' && <RealTimeAdaptationTab key="adaptation" modelVersions={modelVersions} />}
          {activeTab === 'multimodal' && <MultimodalAnalysisTab key="multimodal" />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIIntelligenceDashboard;