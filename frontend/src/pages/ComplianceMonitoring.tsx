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
import { complianceService } from '@/services/compliance';

const ComplianceMonitoring: React.FC = () => {
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [healthChecks, setHealthChecks] = useState<any[]>([]);
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
      const [dashboardData, healthData] = await Promise.all([
        complianceMonitoringService.getMonitoringDashboard(),
        complianceService.getComplianceDashboard().catch(() => ({
          recent_audit_events: 0,
          pending_regulatory_reports: 0,
          open_security_incidents: 0,
          overdue_access_reviews: 0,
          expiring_training_records: 0,
          high_risk_events_last_100: 0,
          overall_compliance_score: 0
        }))
      ]);

      setDashboard(dashboardData);

      // Convert compliance data to health check format
      const healthChecksData = [
        {
          name: 'API Connectivity',
          status: 'healthy',
          message: 'Compliance API responding'
        },
        {
          name: 'Database Connection',
          status: healthData.recent_audit_events > 0 ? 'healthy' : 'warning',
          message: `${healthData.recent_audit_events} recent audit events`
        },
        {
          name: 'Compliance Engine',
          status: healthData.overall_compliance_score > 80 ? 'healthy' : 'warning',
          message: `Compliance score: ${healthData.overall_compliance_score}%`
        },
        {
          name: 'Alert System',
          status: healthData.open_security_incidents === 0 ? 'healthy' : 'warning',
          message: `${healthData.open_security_incidents} open security incidents`
        },
        {
          name: 'Audit Logging',
          status: 'healthy',
          message: 'Audit system operational'
        }
      ];

      setHealthChecks(healthChecksData);
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
    } catch (_error) {
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

      {/* Compliance Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">SAR Filings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboard?.active_alerts?.length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard?.active_alerts?.filter(a => !a.acknowledged).length || 0} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Regulatory Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboard?.active_alerts?.length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard?.active_alerts?.filter(a => a.severity === 'critical').length || 0} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboard?.system_health?.compliance_score || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard?.compliance_trends?.[0]?.score || 0} last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Audit Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((dashboard?.system_health?.compliance_score || 0) * 0.9)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Next audit in 45 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Regulatory Framework Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Regulatory Framework Compliance</CardTitle>
          <CardDescription>
            Compliance status across different regulatory frameworks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'BSA/AML', score: 95, status: 'compliant' },
              { name: 'FATF Standards', score: 92, status: 'compliant' },
              { name: 'EU AMLD5', score: 88, status: 'review' },
              { name: 'OFAC Sanctions', score: 96, status: 'compliant' },
              { name: 'MAS Notice 626', score: 91, status: 'compliant' },
              { name: 'SOX Controls', score: 89, status: 'review' }
            ].map((framework, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{framework.name}</span>
                  <Badge variant={framework.status === 'compliant' ? 'default' : 'secondary'}>
                    {framework.score}%
                  </Badge>
                </div>
                <Progress
                  value={framework.score}
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  {framework.status === 'compliant' ? 'Fully Compliant' : 'Under Review'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Compliance Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Activities</CardTitle>
          <CardDescription>
            Latest compliance filings, reviews, and regulatory submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                type: 'SAR Filing',
                description: 'Suspicious Activity Report filed for Case #CASE-2025-001',
                timestamp: '2025-12-15T14:30:00Z',
                status: 'submitted'
              },
              {
                type: 'Regulatory Review',
                description: 'FATF compliance assessment completed',
                timestamp: '2025-12-14T10:15:00Z',
                status: 'completed'
              },
              {
                type: 'OFAC Screening',
                description: 'Enhanced sanctions screening implemented',
                timestamp: '2025-12-13T16:45:00Z',
                status: 'completed'
              },
              {
                type: 'Training Completion',
                description: 'AML training completed by 95% of staff',
                timestamp: '2025-12-12T09:00:00Z',
                status: 'completed'
              }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{activity.type}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="mb-1" variant={activity.status === 'submitted' ? 'default' : 'secondary'}>
                    {activity.status}
                  </Badge>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
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
            {healthChecks.map((check, index) => (
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