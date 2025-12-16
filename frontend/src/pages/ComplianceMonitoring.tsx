import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Server,
  Zap,
  Shield,
  Settings,
  Bell
} from 'lucide-react';
import { complianceMonitoringService } from '@/services/complianceMonitoring';
import { MonitoringDashboard } from '@/services/complianceMonitoring';

const ComplianceMonitoring: React.FC = () => {
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMonitoringData();

    // Set up periodic refresh
    const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      const data = await complianceMonitoringService.getMonitoringDashboard();
      setDashboard(data);
    } catch (err) {
      setError('Failed to load monitoring data');
      console.error('Monitoring dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await complianceMonitoringService.acknowledgeAlert(alertId);
      // Refresh data
      await loadMonitoringData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-700 bg-green-100';
      case 'degraded': return 'text-yellow-700 bg-yellow-100';
      case 'unhealthy': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Monitoring</h1>
          <p className="text-gray-600 mt-2">Real-time monitoring of compliance systems and alerts</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={loadMonitoringData}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            System Health Overview
          </CardTitle>
          <CardDescription>
            Current status of compliance systems and infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dashboard?.system_health.uptime || 0}%
              </div>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dashboard?.system_health.response_time || 0}ms
              </div>
              <p className="text-sm text-gray-600">Response Time</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {(dashboard?.system_health.error_rate || 0) * 100}%
              </div>
              <p className="text-sm text-gray-600">Error Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {dashboard?.system_health.active_users || 0}
              </div>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Active Alerts ({dashboard?.active_alerts.length || 0})
          </CardTitle>
          <CardDescription>
            Current compliance alerts requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard?.active_alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">No active alerts</p>
              <p className="text-sm text-gray-500">All systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboard?.active_alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <Badge variant="outline" className="capitalize">
                          {alert.severity}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium">{alert.message}</p>
                      {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Details:</strong> {JSON.stringify(alert.metadata)}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {alert.acknowledged && !alert.resolved && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Acknowledged
                        </Badge>
                      )}
                      {alert.resolved && (
                        <Badge className="bg-green-100 text-green-800">
                          Resolved
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators for compliance systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">API Response Time</span>
                <span className="text-sm text-gray-600">
                  {dashboard?.performance_metrics.api_response_time || 0}ms
                </span>
              </div>
              <Progress
                value={Math.min((dashboard?.performance_metrics.api_response_time || 0) / 5, 100)}
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">Target: {'<'}500ms</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Database Query Time</span>
                <span className="text-sm text-gray-600">
                  {dashboard?.performance_metrics.database_query_time || 0}ms
                </span>
              </div>
              <Progress
                value={Math.min((dashboard?.performance_metrics.database_query_time || 0) / 2, 100)}
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">Target: {'<'}100ms</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-sm text-gray-600">
                  {(dashboard?.performance_metrics.error_rate || 0) * 100}%
                </span>
              </div>
              <Progress
                value={(dashboard?.performance_metrics.error_rate || 0) * 1000}
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">Target: {'<'}1%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Compliance Trends
          </CardTitle>
          <CardDescription>
            Historical compliance scores and alert patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard?.compliance_trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{trend.period}</p>
                  <p className="text-sm text-gray-600">
                    {trend.alerts_count} alerts • Score: {trend.score}%
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={trend.score >= 90 ? "default" : "secondary"}>
                    {trend.score}%
                  </Badge>
                  {trend.alerts_count > 0 && (
                    <Badge variant="destructive">
                      {trend.alerts_count} alerts
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            System Health Checks
          </CardTitle>
          <CardDescription>
            Automated health checks for compliance systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock health checks - in production, fetch from service */}
            {[
              { name: 'API Connectivity', status: 'healthy', message: 'All endpoints responding' },
              { name: 'Database Connection', status: 'healthy', message: 'Primary database accessible' },
              { name: 'Compliance Engine', status: 'healthy', message: 'Rule engine operating normally' },
              { name: 'Alert System', status: 'healthy', message: 'Notifications functioning' },
              { name: 'Audit Logging', status: 'healthy', message: 'All events being logged' }
            ].map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{check.name}</p>
                    <p className="text-sm text-gray-600">{check.message}</p>
                  </div>
                </div>
                <Badge className={getHealthStatusColor(check.status)}>
                  {check.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceMonitoring;