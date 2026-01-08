// frontend/src/components/ai/PredictiveMaintenanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Shield, Play, StopCircle, RefreshCw,
  BarChart3, AlertTriangle, Zap, Wrench, CheckCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

import { SystemMetrics, FailurePrediction, ChaosExperimentResult, SelfHealingAction } from '@/types/predictive-maintenance';
import { MaintenanceOverview } from '@/components/features/predictive-maintenance/MaintenanceOverview';
import { FailurePredictionsList } from '@/components/features/predictive-maintenance/FailurePredictionsList';
import { ChaosEngineeringPanel } from '@/components/features/predictive-maintenance/ChaosEngineeringPanel';
import { SelfHealingActionsList } from '@/components/features/predictive-maintenance/SelfHealingActionsList';

const PredictiveMaintenanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'chaos' | 'healing'>('overview');
  const [systemHealth, setSystemHealth] = useState<number>(85.5);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [predictions, setPredictions] = useState<FailurePrediction[]>([]);
  const [chaosExperiments, setChaosExperiments] = useState<ChaosExperimentResult[]>([]);
  const [healingActions, setHealingActions] = useState<SelfHealingAction[]>([]);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data - would be replaced with actual API calls
      const mockMetrics: SystemMetrics = {
        timestamp: new Date().toISOString(),
        cpu_percent: 45.2,
        memory_percent: 67.8,
        disk_io_percent: 23.1,
        network_latency_ms: 45.3,
        active_connections: 124,
        queue_depth: 8,
        error_rate: 0.012,
        response_time_ms: 145.6
      };

      const mockPredictions: FailurePrediction[] = [
        {
          failure_mode: "cpu_spike",
          probability: 0.15,
          time_to_failure_hours: 18.5,
          confidence_score: 0.78,
          contributing_factors: ["High concurrent users", "Complex queries"],
          recommended_actions: ["scale_up", "optimize_queries"],
          predicted_impact: "Degraded response times during peak hours"
        },
        {
          failure_mode: "memory_leak",
          probability: 0.08,
          time_to_failure_hours: 72.0,
          confidence_score: 0.65,
          contributing_factors: ["Large dataset processing", "Cache not optimized"],
          recommended_actions: ["clear_cache", "restart_service"],
          predicted_impact: "Potential service restarts under memory pressure"
        }
      ];

      const mockExperiments: ChaosExperimentResult[] = [
        {
          experiment_id: "chaos_cpu_stress_1703123456",
          experiment_type: "cpu_stress",
          start_time: "2025-12-10T14:30:00Z",
          end_time: "2025-12-10T15:00:00Z",
          duration_seconds: 1800,
          system_stability_score: 78.5,
          failure_injection_success: true,
          recovery_time_seconds: 45.2,
          affected_services: ["application_server", "database"],
          lessons_learned: [
            "System handles CPU stress well",
            "Recovery procedures are effective",
            "Auto-scaling triggers appropriately"
          ]
        }
      ];

      const mockHealingActions: SelfHealingAction[] = [
        {
          action_id: "healing_memory_leak_1703123456",
          action_type: "clear_cache",
          target_service: "cache_service",
          trigger_condition: "Predicted memory_leak with 85% probability",
          execution_time: "2025-12-10T12:15:00Z",
          success: true,
          impact_assessment: "Successfully prevented memory exhaustion",
          rollback_available: true
        }
      ];

      setCurrentMetrics(mockMetrics);
      setPredictions(mockPredictions);
      setChaosExperiments(mockExperiments);
      setHealingActions(mockHealingActions);
      setSystemHealth(87.3);

    } catch (err) {
      console.error('Failed to load predictive maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitoring = async () => {
    try {
      setMonitoringActive(!monitoringActive);
    } catch (err) {
      console.error('Failed to toggle monitoring:', err);
    }
  };

  const runChaosExperiment = async (experimentType: string) => {
    try {
      console.log(`Running chaos experiment: ${experimentType}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to run chaos experiment:', err);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (health >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return 'text-red-600';
    if (probability >= 0.5) return 'text-orange-600';
    return 'text-yellow-600';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-slate-600">Loading Predictive Maintenance Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              Predictive System Maintenance
            </h1>
            <p className="text-slate-600 mt-1">
              AI-driven capacity planning and self-healing infrastructure
            </p>
          </div>

          <div className="flex items-center space-x-3">
             <Button
                variant={monitoringActive ? "destructive" : "default"}
                onClick={toggleMonitoring}
                className={monitoringActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
             >
                {monitoringActive ? <StopCircle className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {monitoringActive ? 'Stop Monitoring' : 'Start Monitoring'}
             </Button>
             <Button variant="outline" onClick={loadDashboardData} className="bg-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
             </Button>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between col-span-1 md:col-span-2 lg:col-span-1">
           <div>
              <div className="text-3xl font-bold text-slate-900">{systemHealth.toFixed(1)}</div>
              <div className="text-sm text-slate-500">System Health Score</div>
           </div>
           <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getHealthColor(systemHealth)}`}>
              {systemHealth >= 90 ? 'EXCELLENT' : systemHealth >= 75 ? 'GOOD' : 'Attention'}
           </span>
        </div>
        {/* Additional header metrics could go here or inside tabs */}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6 bg-white p-1 rounded-t-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'predictions', label: 'Failure Predictions', icon: AlertTriangle },
          { id: 'chaos', label: 'Chaos Engineering', icon: Zap },
          { id: 'healing', label: 'Self-Healing Actions', icon: Wrench }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <MaintenanceOverview
            key="overview"
            monitoringActive={monitoringActive}
            currentMetrics={currentMetrics}
            predictions={predictions}
          />
        )}

        {activeTab === 'predictions' && (
          <FailurePredictionsList
            key="predictions"
            predictions={predictions}
            getProbabilityColor={getProbabilityColor}
          />
        )}

        {activeTab === 'chaos' && (
          <ChaosEngineeringPanel
            key="chaos"
            chaosExperiments={chaosExperiments}
            onRunExperiment={runChaosExperiment}
          />
        )}

        {activeTab === 'healing' && (
          <SelfHealingActionsList
            key="healing"
            healingActions={healingActions}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PredictiveMaintenanceDashboard;