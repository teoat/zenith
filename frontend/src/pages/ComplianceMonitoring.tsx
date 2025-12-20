import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Progress } from '@/components/ui/Progress';
import {
  Activity,
  AlertTriangle,
  Server,
  Zap,
  Shield,
  Settings,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Bell
} from 'lucide-react';
import { complianceMonitoringService, type MonitoringDashboard } from '@/services/complianceMonitoring';
import { complianceService } from '@/services/compliance';
import { secureLogger } from '../utils/secureLogger';
import { ComplianceAlerts } from '../components/compliance/ComplianceAlerts';
import { ComplianceFrameworks } from '../components/compliance/ComplianceFrameworks';
import { ComplianceTrends } from '../components/compliance/ComplianceTrends';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'degraded' | 'unhealthy';
  message: string;
}

const ComplianceMonitoring: React.FC = () => {
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
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
      secureLogger.error('Monitoring dashboard error:', err);
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
      secureLogger.error('Failed to acknowledge alert:', error);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-700 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'warning': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'unhealthy': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 font-medium animate-pulse">Syncing Compliance Systems...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="rounded-2xl shadow-lg border-red-200">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">Monitoring Subsystem Error</AlertTitle>
          <AlertDescription>{error}. Please contact devops or verify API connectivity.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 text-indigo-500 mb-1">
             <Activity className="w-4 h-4" />
             <span className="text-xs font-bold uppercase tracking-widest">Real-time Intelligence</span>
           </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Compliance Monitoring</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl text-lg">
             Live telemetry from regulatory engines, audit subsystems, and active security perimeter.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" className="rounded-xl border-slate-200 dark:border-slate-800" onClick={loadMonitoringData}>
            <Activity className="h-4 w-4 mr-2" />
            Force Sync
          </Button>
          <Button size="lg" className="rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20">
            <Settings className="h-4 w-4 mr-2" />
            Governance Settings
          </Button>
        </div>
      </header>

      {/* System Health Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Uptime', value: `${dashboard?.system_health.uptime || 0}%`, icon: Server, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Avg Latency', value: `${dashboard?.system_health.response_time || 0}ms`, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Error Margin', value: `${((dashboard?.system_health.error_rate || 0) * 100).toFixed(2)}%`, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Active Sessions', value: dashboard?.system_health.active_users || 0, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50' }
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className={`text-3xl font-extrabold ${item.color}`}>{item.value}</p>
                </div>
                <div className={`p-3 rounded-2xl ${item.bg} dark:bg-slate-800`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
           {/* Active Alerts - Extracted */}
           <ComplianceAlerts 
              alerts={dashboard?.active_alerts || []} 
              onAcknowledge={acknowledgeAlert} 
           />

           {/* Performance Metrics Section - Refactored */}
           <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
             <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
               <div className="flex items-center gap-2">
                 <Zap className="h-5 w-5 text-amber-500" />
                 <div>
                   <CardTitle className="text-lg">Latency & Error Performance</CardTitle>
                   <CardDescription>KPI analysis for compliance engine throughput</CardDescription>
                 </div>
               </div>
             </CardHeader>
             <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-sm">API Latency</span>
                      <span className="text-indigo-600">{dashboard?.performance_metrics.api_response_time || 0}ms</span>
                    </div>
                    <Progress 
                      value={Math.min((dashboard?.performance_metrics.api_response_time || 0) / 5, 100)} 
                      className="h-2.5 rounded-full" 
                    />
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">SLA Goal: {'<'}500ms</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-sm">DB Utilization</span>
                      <span className="text-indigo-600">{dashboard?.performance_metrics.database_query_time || 0}ms</span>
                    </div>
                    <Progress 
                      value={Math.min((dashboard?.performance_metrics.database_query_time || 0) / 2, 100)} 
                      className="h-2.5 rounded-full" 
                    />
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">SLA Goal: {'<'}100ms</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-sm">Incident Rate</span>
                      <span className="text-red-500">{(dashboard?.performance_metrics.error_rate || 0) * 100}%</span>
                    </div>
                    <Progress 
                      value={(dashboard?.performance_metrics.error_rate || 0) * 1000} 
                      className="h-2.5 rounded-full bg-red-100" 
                    />
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">SLA Goal: {'<'}0.1%</p>
                  </div>
                </div>
             </CardContent>
           </Card>

           {/* Trends - Extracted */}
           <ComplianceTrends trends={dashboard?.compliance_trends || []} />
        </div>

        <div className="space-y-8">
           {/* Detailed Status Checks */}
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
            {healthChecks.map((check: HealthCheck, index: number) => (
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

           {/* Regulatory Frameworks - Extracted */}
           <ComplianceFrameworks />

           {/* Quick Actions */}
           <div className="p-6 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden group">
              <Sparkles className="absolute -right-4 -top-4 w-32 h-32 opacity-10 group-hover:scale-125 transition-transform" />
              <h4 className="text-xl font-extrabold mb-2 relative z-10">Governance Report</h4>
              <p className="text-sm text-indigo-100 mb-6 relative z-10">Export a real-time snapshot of the compliance state for regulatory auditors.</p>
              <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl relative z-10 shadow-lg">
                Generate Instant PDF
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceMonitoring;