import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  Users,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface SystemMetrics {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: number;
  active_connections: number;
  response_time: number;
  error_rate: number;
  throughput: number;
}

interface CollaborationStats {
  active_sessions: number;
  total_connections: number;
  total_participants: number;
  server_running: boolean;
}

interface PerformanceDashboardProps {
  refreshInterval?: number;
  className?: string;
}

export function PerformanceDashboard({
  refreshInterval = 5000,
  className = ''
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [collaborationStats, setCollaborationStats] = useState<CollaborationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch system metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/v1/monitoring/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastUpdate(new Date());
      } else {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Fetch collaboration stats
  const fetchCollaborationStats = async () => {
    try {
      const response = await fetch('/api/v1/collaboration/stats');
      if (response.ok) {
        const data = await response.json();
        setCollaborationStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch collaboration stats:', err);
    }
  };

  // Initial load and refresh interval
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMetrics(), fetchCollaborationStats()]);
      setLoading(false);
    };

    loadData();

    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Metric card component
  const MetricCard = ({
    title,
    value,
    unit,
    icon: Icon,
    status,
    trend
  }: {
    title: string;
    value: number | string;
    unit?: string;
    icon: any;
    status: 'good' | 'warning' | 'critical';
    trend?: 'up' | 'down' | 'stable';
  }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'good': return 'text-green-600 bg-green-50 border-green-200';
        case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      }
    };

    const getTrendIcon = () => {
      switch (trend) {
        case 'up': return <TrendingUp className="w-3 h-3 text-red-500" />;
        case 'down': return <TrendingDown className="w-3 h-3 text-green-500" />;
        default: return null;
      }
    };

    return (
      <Card className={`${getStatusColor()} border`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{title}</span>
            </div>
            {getTrendIcon()}
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">
              {typeof value === 'number' ? value.toFixed(1) : value}
              {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Get status for CPU usage
  const getCpuStatus = (cpu: number) => {
    if (cpu > 90) return 'critical';
    if (cpu > 70) return 'warning';
    return 'good';
  };

  // Get status for memory usage
  const getMemoryStatus = (memory: number) => {
    if (memory > 90) return 'critical';
    if (memory > 80) return 'warning';
    return 'good';
  };

  // Get status for response time
  const getResponseTimeStatus = (rt: number) => {
    if (rt > 2000) return 'critical'; // > 2 seconds
    if (rt > 500) return 'warning';   // > 500ms
    return 'good';
  };

  // Get status for error rate
  const getErrorRateStatus = (rate: number) => {
    if (rate > 5) return 'critical';  // > 5%
    if (rate > 1) return 'warning';   // > 1%
    return 'good';
  };

  if (loading && !metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Activity className="w-6 h-6 animate-spin mr-2" />
            <span>Loading performance metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-red-600">
            <AlertTriangle className="w-6 h-6 mr-2" />
            <span>Failed to load metrics: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastUpdate && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  Promise.all([fetchMetrics(), fetchCollaborationStats()]).finally(() => setLoading(false));
                }}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="CPU Usage"
            value={metrics.cpu_usage}
            unit="%"
            icon={Cpu}
            status={getCpuStatus(metrics.cpu_usage)}
          />

          <MetricCard
            title="Memory Usage"
            value={metrics.memory_usage}
            unit="%"
            icon={HardDrive}
            status={getMemoryStatus(metrics.memory_usage)}
          />

          <MetricCard
            title="Response Time"
            value={metrics.response_time}
            unit="ms"
            icon={Clock}
            status={getResponseTimeStatus(metrics.response_time)}
          />

          <MetricCard
            title="Error Rate"
            value={metrics.error_rate}
            unit="%"
            icon={AlertTriangle}
            status={getErrorRateStatus(metrics.error_rate)}
          />

          <MetricCard
            title="Active Connections"
            value={metrics.active_connections}
            icon={Users}
            status="good"
          />

          <MetricCard
            title="Throughput"
            value={metrics.throughput}
            unit="req/s"
            icon={Zap}
            status="good"
          />

          <MetricCard
            title="Disk Usage"
            value={metrics.disk_usage}
            unit="%"
            icon={Database}
            status={metrics.disk_usage > 90 ? 'critical' : metrics.disk_usage > 80 ? 'warning' : 'good'}
          />

          <MetricCard
            title="Network I/O"
            value={metrics.network_io}
            unit="MB/s"
            icon={Wifi}
            status="good"
          />
        </div>
      )}

      {/* Collaboration Stats */}
      {collaborationStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Real-time Collaboration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${collaborationStats.server_running ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm">WebSocket Server</span>
                <Badge variant={collaborationStats.server_running ? 'default' : 'destructive'}>
                  {collaborationStats.server_running ? 'Running' : 'Stopped'}
                </Badge>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {collaborationStats.active_sessions}
                </div>
                <div className="text-sm text-gray-600">Active Sessions</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {collaborationStats.total_connections}
                </div>
                <div className="text-sm text-gray-600">Total Connections</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {collaborationStats.total_participants}
                </div>
                <div className="text-sm text-gray-600">Participants</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall Status</span>
                  <Badge variant={
                    (metrics.cpu_usage > 90 || metrics.memory_usage > 90 || metrics.error_rate > 5) ? 'destructive' :
                    (metrics.cpu_usage > 70 || metrics.memory_usage > 80 || metrics.error_rate > 1) ? 'secondary' :
                    'default'
                  }>
                    {(metrics.cpu_usage > 90 || metrics.memory_usage > 90 || metrics.error_rate > 5) ? 'Critical' :
                     (metrics.cpu_usage > 70 || metrics.memory_usage > 80 || metrics.error_rate > 1) ? 'Warning' :
                     'Healthy'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Uptime</span>
                  <span className="text-sm text-gray-600">
                    {/* This would come from the backend */}
                    System running
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Metrics Update</span>
                  <span className="text-sm text-gray-600">
                    {lastUpdate ? `${Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago` : 'Never'}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}