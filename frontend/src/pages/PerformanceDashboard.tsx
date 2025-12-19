import React, { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { useWebSocket } from '../providers/WebSocketProvider';
import { secureLogger } from '../utils/secureLogger';

import type {
  LucideIcon
} from 'lucide-react';
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';



// MetricCard Component - Moved outside
interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  trend?: number;
  status: 'good' | 'warning' | 'critical';
  children?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, icon: Icon, trend, status, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${status === 'good' ? 'bg-success-500/20' : status === 'warning' ? 'bg-warning-500/20' : 'bg-error-500/20'}`}>
          <Icon className={`w-5 h-5 ${status === 'good' ? 'text-success-400' : status === 'warning' ? 'text-warning-400' : 'text-error-400'}`} />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-sm text-secondary-400">{unit}</span>
            {trend && (
              <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-success-400' : 'text-error-400'}`}>
                {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    {children}
  </motion.div>
);

interface PerformanceAlert {
  id: number;
  type: string;
  level: 'good' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

const PerformanceDashboard: React.FC = () => {
  const { isConnected, addListener } = useWebSocket();
  const [metrics, setMetrics] = useState({
    ipc: { calls: 0, avgResponseTime: 0, cacheHitRate: 0 },
    memory: { used: 0, limit: 1, percentage: 0 },
    components: { renderCount: 0, avgRenderTime: 0 },
    api: { totalCalls: 0, avgResponseTime: 0, errorRate: 0 },
    system: { cpu: 0, memory: 0, uptime: 0 }
  });

  const [alerts] = useState<PerformanceAlert[]>([]);
  const [timeRange, setTimeRange] = useState('5m');

  useEffect(() => {
    // Initialize metrics collection
    const updateLocalMetrics = async () => {
      // IPC Metrics (Local/Mock)
      const ipcStats: Record<string, { pendingRequests: number }> = {}; // Memory manager removed
      const ipcMetrics = {
        calls: Object.values(ipcStats).reduce((sum: number, stat) => sum + (stat.pendingRequests || 0), 0),
        avgResponseTime: 45, 
        cacheHitRate: 78
      };

      // Memory Metrics (Local Browser Memory)
      const perfMemory = (performance as any).memory;
      const memoryMetrics = {
        used: perfMemory ? perfMemory.usedJSHeapSize : 0,
        limit: perfMemory ? perfMemory.jsHeapSizeLimit : 1,
        percentage: perfMemory ?
          ((perfMemory.usedJSHeapSize || 0) / (perfMemory.jsHeapSizeLimit || 1)) * 100 : 0
      };

      // Component Metrics (Local)
      const componentMetrics = {
        renderCount: 0, // Memory manager removed
        avgRenderTime: 16
      };
      
      setMetrics(prev => ({
          ...prev,
          ipc: ipcMetrics,
          memory: memoryMetrics,
          components: componentMetrics
      }));
    };

interface SystemMetricsPayload {
    cpu_percent: number;
    memory_percent: number;
    uptime: number;
    request_count: number;
    response_time_avg: number;
    error_rate: number;
}

// ... inside component ...
    // WebSocket listener for Backend Metrics
    const unsubscribeWS = addListener((data) => {
        if (data.type === 'system_metrics' && data.metrics) {
            const metrics = data.metrics as SystemMetricsPayload;
            setMetrics(prev => ({
                ...prev,
                system: {
                    cpu: metrics.cpu_percent || prev.system.cpu,
                    memory: metrics.memory_percent || prev.system.memory,
                    uptime: metrics.uptime || prev.system.uptime
                },
                api: {
                    totalCalls: metrics.request_count || prev.api.totalCalls,
                    avgResponseTime: metrics.response_time_avg || prev.api.avgResponseTime,
                    errorRate: metrics.error_rate || prev.api.errorRate
                }
            }));
        }
    });

    const interval = setInterval(() => { 
        updateLocalMetrics();
        if (!isConnected) {
            // Optional: Poll backend if WS disconnected
        }
    }, 2000);
    
    updateLocalMetrics();

    return () => {
      clearInterval(interval);
      unsubscribeWS();
    };
  }, [isConnected, addListener]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-error-400';
    if (value >= thresholds.warning) return 'text-warning-400';
    return 'text-success-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold title-gradient">Performance Dashboard</h1>
          <p className="text-secondary-400 mt-2">Real-time application performance monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            aria-label="Select Time Range"
            className="px-3 py-2 bg-glass-background border border-glass-border rounded-lg text-sm"
          >
            <option value="1m">Last Minute</option>
            <option value="5m">Last 5 Minutes</option>
            <option value="15m">Last 15 Minutes</option>
            <option value="1h">Last Hour</option>
          </select>
          <button
            onClick={() => secureLogger.info('Memory snapshot functionality removed')}
            className="btn btn-secondary"
          >
            📸 Snapshot
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(-3).map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-lg border ${
                alert.level === 'critical' ? 'bg-error-500/10 border-error-500/20 text-error-400' :
                'bg-warning-500/10 border-warning-500/20 text-warning-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{alert.message}</span>
                <span className="text-xs opacity-70 ml-auto">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* IPC Performance */}
        <MetricCard
          title="IPC Performance"
          value={metrics.ipc.avgResponseTime}
          unit="ms avg"
          icon={Zap}
          trend={-12}
          status="good"
        >
          <div className="space-y-2 text-xs text-secondary-400">
            <div className="flex justify-between">
              <span>Calls/min</span>
              <span>{metrics.ipc.calls}</span>
            </div>
            <div className="flex justify-between">
              <span>Cache Hit Rate</span>
              <span>{metrics.ipc.cacheHitRate}%</span>
            </div>
          </div>
        </MetricCard>

        {/* Memory Usage */}
        <MetricCard
          title="Memory Usage"
          value={metrics.memory.percentage.toFixed(1)}
          unit="%"
          icon={HardDrive}
          trend={3}
          status={metrics.memory.percentage > 80 ? 'critical' : metrics.memory.percentage > 60 ? 'warning' : 'good'}
        >
          <div className="space-y-2 text-xs text-secondary-400">
            <div className="flex justify-between">
              <span>Used</span>
              <span>{formatBytes(metrics.memory.used)}</span>
            </div>
            <div className="flex justify-between">
              <span>Limit</span>
              <span>{formatBytes(metrics.memory.limit)}</span>
            </div>
          </div>
        </MetricCard>

        {/* API Performance */}
        <MetricCard
          title="API Response"
          value={metrics.api.avgResponseTime}
          unit="ms avg"
          icon={Activity}
          trend={-8}
          status={metrics.api.avgResponseTime > 200 ? 'warning' : 'good'}
        >
          <div className="space-y-2 text-xs text-secondary-400">
            <div className="flex justify-between">
              <span>Total Calls</span>
              <span>{metrics.api.totalCalls.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Error Rate</span>
              <span>{(metrics.api.errorRate * 100).toFixed(2)}%</span>
            </div>
          </div>
        </MetricCard>

        {/* System Health */}
        <MetricCard
          title="System Health"
          value={metrics.system.cpu}
          unit="% CPU"
          icon={Cpu}
          trend={2}
          status={metrics.system.cpu > 70 ? 'warning' : 'good'}
        >
          <div className="space-y-2 text-xs text-secondary-400">
            <div className="flex justify-between">
              <span>Uptime</span>
              <span>{metrics.system.uptime}m</span>
            </div>
            <div className="flex justify-between">
              <span>Components</span>
              <span>{metrics.components.renderCount}</span>
            </div>
          </div>
        </MetricCard>
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Timeline */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-semibold">Performance Timeline</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success-400" />
                <span className="text-sm">IPC Optimization</span>
              </div>
              <span className="text-xs text-secondary-400">Active</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-primary-400" />
                <span className="text-sm">Memory Monitoring</span>
              </div>
              <span className="text-xs text-secondary-400">Active</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-warning-400" />
                <span className="text-sm">Cache Warming</span>
              </div>
              <span className="text-xs text-secondary-400">Pending</span>
            </div>
          </div>
        </div>

        {/* System Resources */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-semibold">System Resources</h3>
          </div>

          <div className="space-y-4">
            {/* Memory Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Memory Usage</span>
                <span className={getStatusColor(metrics.memory.percentage, { warning: 60, critical: 80 })}>
                  {metrics.memory.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-secondary-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    metrics.memory.percentage > 80 ? 'bg-error-500' :
                    metrics.memory.percentage > 60 ? 'bg-warning-500' :
                    'bg-success-500'
                  }`}
                  style={{ width: `${Math.min(metrics.memory.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* CPU Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>CPU Usage</span>
                <span className={getStatusColor(metrics.system.cpu, { warning: 50, critical: 70 })}>
                  {metrics.system.cpu}%
                </span>
              </div>
              <div className="w-full bg-secondary-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    metrics.system.cpu > 70 ? 'bg-error-500' :
                    metrics.system.cpu > 50 ? 'bg-warning-500' :
                    'bg-success-500'
                  }`}
                  style={{ width: `${Math.min(metrics.system.cpu, 100)}%` }}
                />
              </div>
            </div>

            {/* Performance Score */}
            <div className="pt-4 border-t border-glass-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Performance Score</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-success-400">92</span>
                  <TrendingUp className="w-4 h-4 text-success-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
