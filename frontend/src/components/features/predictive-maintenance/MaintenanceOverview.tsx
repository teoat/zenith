import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Target,
  Timer,
  Database,
  TrendingUp
} from 'lucide-react';
import { SystemMetrics, FailurePrediction } from '@/types/predictive-maintenance';
import { cn } from '@/lib/utils';

interface MaintenanceOverviewProps {
  monitoringActive: boolean;
  currentMetrics: SystemMetrics | null;
  predictions: FailurePrediction[];
}

export const MaintenanceOverview: React.FC<MaintenanceOverviewProps> = ({
  monitoringActive,
  currentMetrics,
  predictions
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content text-slate-900" // Added text color
    >
      {/* Monitoring Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            {monitoringActive ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <Clock className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Predictive Monitoring</h3>
            <p className="text-slate-600 mt-1">
              {monitoringActive
                ? 'Active - Continuously analyzing system health and predicting failures'
                : 'Inactive - Click "Start Monitoring" to begin predictive analysis'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
        <h3 className="text-lg font-semibold mb-6">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 text-slate-600">
              <Target className="w-5 h-5 text-blue-500" />
              <h4 className="font-medium text-sm">Error Rate</h4>
            </div>
            <div className="text-2xl font-bold mb-1">
              {((currentMetrics?.error_rate || 0) * 100).toFixed(2)}%
            </div>
            <div className="text-xs text-green-600 font-medium">↓ 0.5%</div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 text-slate-600">
              <Timer className="w-5 h-5 text-green-500" />
              <h4 className="font-medium text-sm">Avg Response Time</h4>
            </div>
            <div className="text-2xl font-bold mb-1">
              {currentMetrics?.response_time_ms.toFixed(0)}ms
            </div>
            <div className="text-xs text-green-600 font-medium">↓ 12ms</div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 text-slate-600">
              <Database className="w-5 h-5 text-purple-500" />
              <h4 className="font-medium text-sm">Queue Depth</h4>
            </div>
            <div className="text-2xl font-bold mb-1">
              {currentMetrics?.queue_depth}
            </div>
            <div className="text-xs text-slate-500 font-medium">→ 0</div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 text-slate-600">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h4 className="font-medium text-sm">Predictions Made</h4>
            </div>
            <div className="text-2xl font-bold mb-1">
              {predictions.length}
            </div>
            <div className="text-xs text-slate-500 font-medium">→ 0</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-6">Recent System Activity</h3>
        <div className="space-y-6 relative pl-4 border-l-2 border-slate-100 ml-3">
          <div className="relative">
            <div className="absolute -left-[21px] top-1 rounded-full bg-white p-0.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-slate-900">Self-healing action completed: Cache cleared successfully</p>
              <p className="text-xs text-slate-500 mt-0.5">5 minutes ago</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[21px] top-1 rounded-full bg-white p-0.5">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </div>
             <div className="ml-2">
              <p className="text-sm font-medium text-slate-900">Failure prediction: CPU spike possible in 18 hours</p>
              <p className="text-xs text-slate-500 mt-0.5">15 minutes ago</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[21px] top-1 rounded-full bg-white p-0.5">
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
             <div className="ml-2">
              <p className="text-sm font-medium text-slate-900">Chaos experiment completed: CPU stress test passed</p>
              <p className="text-xs text-slate-500 mt-0.5">2 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
