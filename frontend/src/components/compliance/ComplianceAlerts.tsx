import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Bell, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Alert {
  id: string;
  severity: string;
  timestamp: string;
  message: string;
  metadata?: any;
  acknowledged: boolean;
  resolved: boolean;
}

interface ComplianceAlertsProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
}

export const ComplianceAlerts: React.FC<ComplianceAlertsProps> = ({ alerts, onAcknowledge }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-500" />
            <div>
              <CardTitle className="text-lg">Active Alerts</CardTitle>
              <CardDescription>Current compliance alerts requiring attention</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 font-bold">
            {alerts.length} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-full w-fit mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/20">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">All Clear</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">No active alerts. All systems operating normally.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`group relative p-5 border rounded-2xl transition-all hover:shadow-md ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-1.5 rounded-lg bg-white/50 backdrop-blur-sm">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="capitalize font-bold bg-white/20 border-current/20">
                        {alert.severity}
                      </Badge>
                      <span className="text-xs font-semibold opacity-70 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-bold text-lg mb-1">{alert.message}</p>
                    {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                      <div className="mt-2 text-sm p-3 bg-black/5 rounded-xl border border-black/5 font-mono">
                         {JSON.stringify(alert.metadata)}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0">
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        onClick={() => onAcknowledge(alert.id)}
                        className="bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm"
                      >
                        Acknowledge
                      </Button>
                    )}
                    {alert.acknowledged && !alert.resolved && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        Acknowledged
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
  );
};
