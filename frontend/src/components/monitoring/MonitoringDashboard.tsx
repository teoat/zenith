// frontend/src/components/monitoring/MonitoringDashboard.tsx
import { useState, useCallback, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Cpu,
  MemoryStick,
  Network,
  TrendingUp,
  Clock,
  Zap,
  Shield,
  HardDrive,
  BarChart3
} from 'lucide-react';
import { api } from '../../lib/api';

interface SystemMetrics {
  status: 'healthy' | 'warning' | 'critical';
  health_score: number;
  timestamp: string;
  metrics: {
    cpu_percent: number;
    memory_percent: number;
    memory_used_mb: number;
    disk_usage_percent: number;
    network_connections: number;
    active_threads: number;
    request_count: number;
    error_count: number;
    response_time_avg: number;
  };
}

interface PerformanceData {
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  response_time_avg: number;
  request_count: number;
  error_count: number;
}

interface ErrorSummary {
  total_errors: number;
  error_types: Record<string, number>;
  recent_errors: Array<{
    timestamp: string;
    error_type: string;
    message: string;
    metadata: Record<string, any>;
  }>;
}

export function MonitoringDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24); // hours

  const loadMonitoringData = useCallback(async () => {
    try {
      setLoading(true);

      // Load system status
      const statusResponse = await api.getSystemStatus();
      setSystemStatus(statusResponse);

      // Load performance history
      const performanceResponse = await api.getPerformanceHistory(timeRange);
      setPerformanceData(performanceResponse);

      // Load err summary
      const errorResponse = await api.getErrorSummary(timeRange);
      setErrorSummary(errorResponse);

    } catch (err) {
      console.error('Failed to load monitoring data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadMonitoringData();
  }, [loadMonitoringData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Shield className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading && !systemStatus) {
    return (
      <div className="monitoring-dashboard loading">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">Real-time application performance and health metrics</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            aria-label="Select time range"
          >
            <option value={1}>Last Hour</option>
            <option value={6}>Last 6 Hours</option>
            <option value={24}>Last 24 Hours</option>
            <option value={72}>Last 3 Days</option>
          </select>

          <button
            onClick={loadMonitoringData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System Status */}
      {systemStatus && (
        <div className={`system-status-card ${getStatusColor(systemStatus.status)} border rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(systemStatus.status)}
              <div>
                <h3 className="text-lg font-semibold">System Status</h3>
                <p className="text-sm opacity-75 capitalize">{systemStatus.status}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{systemStatus.health_score.toFixed(1)}%</div>
              <div className="text-sm opacity-75">Health Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">CPU</div>
              <div className="text-lg">{systemStatus.metrics.cpu_percent.toFixed(1)}%</div>
            </div>
            <div>
              <div className="font-medium">Memory</div>
              <div className="text-lg">{systemStatus.metrics.memory_percent.toFixed(1)}%</div>
            </div>
            <div>
              <div className="font-medium">Requests</div>
              <div className="text-lg">{systemStatus.metrics.request_count}</div>
            </div>
            <div>
              <div className="font-medium">Errors</div>
              <div className="text-lg">{systemStatus.metrics.error_count}</div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Usage */}
        <div className="metric-card glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-gray-500">CPU</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {systemStatus?.metrics.cpu_percent.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {systemStatus && systemStatus.metrics.cpu_percent > 80 ? (
              <span className="text-red-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                High usage
              </span>
            ) : (
              <span className="text-green-600">Normal</span>
            )}
          </div>
        </div>

        {/* Memory Usage */}
        <div className="metric-card glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <MemoryStick className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-gray-500">Memory</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {systemStatus?.metrics.memory_used_mb.toFixed(0)}MB
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {systemStatus?.metrics.memory_percent.toFixed(1)}% used
          </div>
        </div>

        {/* Response Time */}
        <div className="metric-card glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="text-xs text-gray-500">Response Time</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {systemStatus?.metrics.response_time_avg.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Average response time
          </div>
        </div>

        {/* Error Rate */}
        <div className="metric-card glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-xs text-gray-500">Errors</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {systemStatus?.metrics.error_count}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Total errors
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="performance-chart glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance Trends
        </h3>

        {performanceData.length > 0 ? (
          <div className="chart-placeholder bg-gray-50 rounded-lg p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Performance chart would be displayed here</p>
            <p className="text-sm text-gray-500 mt-2">
              {performanceData.length} data points available
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No performance data available
          </div>
        )}
      </div>

      {/* Error Summary */}
      {errorSummary && (
        <div className="error-summary glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Error Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Error Stats */}
            <div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {errorSummary.total_errors}
              </div>
              <div className="text-sm text-gray-600 mb-4">Total errors in last {timeRange} hours</div>

              {Object.keys(errorSummary.error_types).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Error Types:</h4>
                  {Object.entries(errorSummary.error_types).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Errors */}
            <div>
              <h4 className="font-medium mb-3">Recent Errors</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {errorSummary.recent_errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm capitalize">
                        {error.error_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-red-800 truncate">{error.message}</p>
                  </div>
                ))}
                {errorSummary.recent_errors.length === 0 && (
                  <p className="text-sm text-gray-500">No recent errors</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="additional-metrics grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Network className="w-5 h-5 text-indigo-600" />
            <span className="text-xs text-gray-500">Network</span>
          </div>
          <div className="text-xl font-bold text-indigo-600">
            {systemStatus?.metrics.network_connections}
          </div>
          <div className="text-xs text-gray-600 mt-1">Active connections</div>
        </div>

        <div className="metric-card glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <HardDrive className="w-5 h-5 text-orange-600" />
            <span className="text-xs text-gray-500">Disk</span>
          </div>
          <div className="text-xl font-bold text-orange-600">
            {systemStatus?.metrics.disk_usage_percent.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">Disk usage</div>
        </div>

        <div className="metric-card glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span className="text-xs text-gray-500">Threads</span>
          </div>
          <div className="text-xl font-bold text-yellow-600">
            {systemStatus?.metrics.active_threads}
          </div>
          <div className="text-xs text-gray-600 mt-1">Active threads</div>
        </div>
      </div>
    </div>
  );
}