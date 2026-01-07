import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Shield,
  Play,
  StopCircle,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  Zap,
  Wrench,
  Cpu,
  HardDrive,
  Network,
  Activity,
} from "lucide-react";

import { usePredictiveMaintenance } from "@/hooks/usePredictiveMaintenance";
import { PredictiveOverview } from "@/components/ai/predictive/PredictiveOverview";
import { FailurePredictions } from "@/components/ai/predictive/FailurePredictions";
import { ChaosEngineering } from "@/components/ai/predictive/ChaosEngineering";
import { SelfHealing } from "@/components/ai/predictive/SelfHealing";

const PredictiveMaintenanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "predictions" | "chaos" | "healing"
  >("overview");

  const {
    systemHealth,
    currentMetrics,
    predictions,
    chaosExperiments,
    healingActions,
    monitoringActive,
    loading,
    loadDashboardData,
    toggleMonitoring,
    runChaosExperiment,
  } = usePredictiveMaintenance();

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getHealthColor = (health: number) => {
    if (health >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (health >= 75) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  if (loading && !currentMetrics) {
    return (
      <div className="predictive-maintenance-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-slate-600">
          Loading Predictive Maintenance Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="predictive-maintenance-dashboard">
      {/* Header */}
      <div className="dashboard-header">
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
            <button
              onClick={toggleMonitoring}
              className={`px-4 py-2 rounded-lg flex items-center ${
                monitoringActive
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {monitoringActive ? (
                <StopCircle className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {monitoringActive ? "Stop Monitoring" : "Start Monitoring"}
            </button>
            <button
              onClick={() => loadDashboardData()}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="health-overview">
        <div className="health-score-card">
          <div className="score-display">
            <div className="score-value">{systemHealth.toFixed(1)}</div>
            <div className="score-label">System Health</div>
          </div>
          <div className="score-status">
            <span className={`status-badge ${getHealthColor(systemHealth)}`}>
              {systemHealth >= 90
                ? "EXCELLENT"
                : systemHealth >= 75
                  ? "GOOD"
                  : "NEEDS ATTENTION"}
            </span>
          </div>
        </div>

        {currentMetrics && (
          <div className="metrics-overview">
            <div className="metric-item">
              <Cpu className="w-5 h-5 text-blue-500" />
              <div>
                <div className="metric-value">
                  {currentMetrics.cpu_percent.toFixed(1)}%
                </div>
                <div className="metric-label">CPU Usage</div>
              </div>
            </div>
            <div className="metric-item">
              <HardDrive className="w-5 h-5 text-green-500" />
              <div>
                <div className="metric-value">
                  {currentMetrics.memory_percent.toFixed(1)}%
                </div>
                <div className="metric-label">Memory Usage</div>
              </div>
            </div>
            <div className="metric-item">
              <Network className="w-5 h-5 text-purple-500" />
              <div>
                <div className="metric-value">
                  {currentMetrics.network_latency_ms.toFixed(1)}ms
                </div>
                <div className="metric-label">Network Latency</div>
              </div>
            </div>
            <div className="metric-item">
              <Activity className="w-5 h-5 text-orange-500" />
              <div>
                <div className="metric-value">
                  {currentMetrics.active_connections}
                </div>
                <div className="metric-label">Active Connections</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          {
            id: "predictions",
            label: "Failure Predictions",
            icon: AlertTriangle,
          },
          { id: "chaos", label: "Chaos Engineering", icon: Zap },
          { id: "healing", label: "Self-Healing Actions", icon: Wrench },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <PredictiveOverview
            monitoringActive={monitoringActive}
            currentMetrics={currentMetrics}
            predictions={predictions}
          />
        )}

        {activeTab === "predictions" && (
          <FailurePredictions predictions={predictions} />
        )}

        {activeTab === "chaos" && (
          <ChaosEngineering
            chaosExperiments={chaosExperiments}
            onRunExperiment={runChaosExperiment}
          />
        )}

        {activeTab === "healing" && (
          <SelfHealing healingActions={healingActions} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PredictiveMaintenanceDashboard;
