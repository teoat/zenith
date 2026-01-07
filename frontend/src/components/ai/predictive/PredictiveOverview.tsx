import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Target,
  Timer,
  Database,
  TrendingUp,
  AlertTriangle,
  Zap,
} from "lucide-react";
import type {
  SystemMetrics,
  FailurePrediction,
} from "@/components/ai/types/predictive";

interface PredictiveOverviewProps {
  monitoringActive: boolean;
  currentMetrics: SystemMetrics | null;
  predictions: FailurePrediction[];
}

export const PredictiveOverview: React.FC<PredictiveOverviewProps> = ({
  monitoringActive,
  currentMetrics,
  predictions,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      {/* Monitoring Status */}
      <div className="monitoring-status">
        <div className="status-card">
          <div className="status-icon">
            {monitoringActive ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <Clock className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div className="status-content">
            <h3 className="status-title">Predictive Monitoring</h3>
            <p className="status-description">
              {monitoringActive
                ? "Active - Continuously analyzing system health and predicting failures"
                : 'Inactive - Click "Start Monitoring" to begin predictive analysis'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="key-metrics">
        <h3 className="section-title">Key Performance Indicators</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <Target className="w-6 h-6 text-blue-500" />
              <h4>Error Rate</h4>
            </div>
            <div className="metric-value-large">
              {((currentMetrics?.error_rate || 0) * 100).toFixed(2)}%
            </div>
            <div className="metric-trend positive">↓ 0.5%</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Timer className="w-6 h-6 text-green-500" />
              <h4>Avg Response Time</h4>
            </div>
            <div className="metric-value-large">
              {currentMetrics?.response_time_ms.toFixed(0)}ms
            </div>
            <div className="metric-trend positive">↓ 12ms</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Database className="w-6 h-6 text-purple-500" />
              <h4>Queue Depth</h4>
            </div>
            <div className="metric-value-large">
              {currentMetrics?.queue_depth}
            </div>
            <div className="metric-trend neutral">→ 0</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              <h4>Predictions Made</h4>
            </div>
            <div className="metric-value-large">{predictions.length}</div>
            <div className="metric-trend neutral">→ 0</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3 className="section-title">Recent System Activity</h3>
        <div className="activity-timeline">
          <div className="activity-item">
            <div className="activity-icon">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="activity-content">
              <p className="activity-text">
                Self-healing action completed: Cache cleared successfully
              </p>
              <p className="activity-time">5 minutes ago</p>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="activity-content">
              <p className="activity-text">
                Failure prediction: CPU spike possible in 18 hours
              </p>
              <p className="activity-time">15 minutes ago</p>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
            <div className="activity-content">
              <p className="activity-text">
                Chaos experiment completed: CPU stress test passed
              </p>
              <p className="activity-time">2 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
