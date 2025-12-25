// Compliance Monitoring Service - Real-time monitoring and alerting for compliance systems
// Tracks system health, compliance metrics, and provides alerting capabilities

interface SystemMetrics {
  uptime: number;
  response_time: number;
  error_rate: number;
  active_users: number;
  compliance_score: number;
  last_updated: string;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  last_triggered?: string;
}

interface ComplianceAlert {
  id: string;
  rule_id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  metadata: Record<string, any>;
}

interface MonitoringDashboard {
  system_health: SystemMetrics;
  active_alerts: ComplianceAlert[];
  recent_incidents: any[];
  compliance_trends: {
    period: string;
    score: number;
    alerts_count: number;
  }[];
  performance_metrics: {
    api_response_time: number;
    database_query_time: number;
    error_rate: number;
  };
}

class ComplianceMonitoringService {
  private alertRules: AlertRule[] = [
    {
      id: 'compliance-score-low',
      name: 'Compliance Score Below Threshold',
      condition: 'compliance_score < 80',
      threshold: 80,
      severity: 'high',
      enabled: true
    },
    {
      id: 'high-error-rate',
      name: 'High Error Rate Detected',
      condition: 'error_rate > 5',
      threshold: 5,
      severity: 'medium',
      enabled: true
    },
    {
      id: 'response-time-high',
      name: 'API Response Time High',
      condition: 'response_time > 2000',
      threshold: 2000,
      severity: 'medium',
      enabled: true
    },
    {
      id: 'pending-reports-high',
      name: 'High Number of Pending Reports',
      condition: 'pending_reports > 10',
      threshold: 10,
      severity: 'high',
      enabled: true
    },
    {
      id: 'overdue-reviews',
      name: 'Overdue Access Reviews',
      condition: 'overdue_reviews > 0',
      threshold: 0,
      severity: 'medium',
      enabled: true
    }
  ];

  // System Health Monitoring
  async getSystemHealth(): Promise<SystemMetrics> {
    try {
      // In production, this would query actual system metrics
      // For demo, return mock data
      return {
        uptime: 99.9,
        response_time: 245,
        error_rate: 0.02,
        active_users: 42,
        compliance_score: 92,
        last_updated: new Date().toISOString()
      };
    } catch (_error) {
      console.error('Failed to get system health:', error);
      throw error;
    }
  }

  async getMonitoringDashboard(): Promise<MonitoringDashboard> {
    try {
      const [systemHealth, alerts, complianceData] = await Promise.all([
        this.getSystemHealth(),
        this.getActiveAlerts(),
        this.getComplianceTrends()
      ]);

      return {
        system_health: systemHealth,
        active_alerts: alerts,
        recent_incidents: [], // Would be populated from incident service
        compliance_trends: complianceData,
        performance_metrics: {
          api_response_time: systemHealth.response_time,
          database_query_time: 45, // Mock data
          error_rate: systemHealth.error_rate
        }
      };
    } catch (_error) {
      console.error('Failed to get monitoring dashboard:', error);
      throw error;
    }
  }

  // Alert Management
  async getAlertRules(): Promise<AlertRule[]> {
    return this.alertRules;
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error('Alert rule not found');
    }

    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    // In production, persist to backend
  }

  async getActiveAlerts(): Promise<ComplianceAlert[]> {
    try {
      // Mock active alerts based on current metrics
      const metrics = await this.getSystemHealth();
      const alerts: ComplianceAlert[] = [];

      if (metrics.compliance_score < 90) {
        alerts.push({
          id: 'alert-1',
          rule_id: 'compliance-score-low',
          message: `Compliance score is ${metrics.compliance_score}%, below 90% threshold`,
          severity: 'high',
          timestamp: new Date().toISOString(),
          acknowledged: false,
          resolved: false,
          metadata: { current_score: metrics.compliance_score }
        });
      }

      if (metrics.error_rate > 0.05) {
        alerts.push({
          id: 'alert-2',
          rule_id: 'high-error-rate',
          message: `Error rate is ${metrics.error_rate}%, above 5% threshold`,
          severity: 'medium',
          timestamp: new Date().toISOString(),
          acknowledged: false,
          resolved: false,
          metadata: { current_rate: metrics.error_rate }
        });
      }

      return alerts;
    } catch (_error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    // In production, call backend API
    console.log(`Alert ${alertId} acknowledged`);
  }

  async resolveAlert(alertId: string): Promise<void> {
    // In production, call backend API
    console.log(`Alert ${alertId} resolved`);
  }

  // Compliance Trends
  async getComplianceTrends(): Promise<{ period: string; score: number; alerts_count: number }[]> {
    // Mock compliance trend data
    return [
      { period: 'Last 7 days', score: 94, alerts_count: 2 },
      { period: 'Last 30 days', score: 92, alerts_count: 5 },
      { period: 'Last 90 days', score: 89, alerts_count: 12 },
      { period: 'Last 6 months', score: 91, alerts_count: 8 }
    ];
  }

  // Threshold Monitoring
  async checkThresholds(): Promise<void> {
    try {
      const metrics = await this.getSystemHealth();

      for (const rule of this.alertRules) {
        if (!rule.enabled) continue;

        let triggered = false;
        let currentValue = 0;

        switch (rule.condition) {
          case 'compliance_score < 80':
            triggered = metrics.compliance_score < rule.threshold;
            currentValue = metrics.compliance_score;
            break;
          case 'error_rate > 5':
            triggered = metrics.error_rate > rule.threshold;
            currentValue = metrics.error_rate;
            break;
          case 'response_time > 2000':
            triggered = metrics.response_time > rule.threshold;
            currentValue = metrics.response_time;
            break;
        }

        if (triggered) {
          await this.createAlert(rule, currentValue);
        }
      }
    } catch (_error) {
      console.error('Failed to check thresholds:', error);
    }
  }

  private async createAlert(rule: AlertRule, currentValue: number): Promise<void> {
    const alert: ComplianceAlert = {
      id: `alert-${Date.now()}`,
      rule_id: rule.id,
      message: `${rule.name}: Current value ${currentValue} ${rule.condition.split(' ')[1]} threshold ${rule.threshold}`,
      severity: rule.severity,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      metadata: {
        rule_name: rule.name,
        current_value: currentValue,
        threshold: rule.threshold,
        condition: rule.condition
      }
    };

    // In production, send to backend and notification system
    console.warn('Alert triggered:', alert);
  }

  // Performance Monitoring
  async getPerformanceMetrics(): Promise<{
    api_response_time: number;
    database_query_time: number;
    error_rate: number;
    throughput: number;
  }> {
    // Mock performance data
    return {
      api_response_time: 245,
      database_query_time: 45,
      error_rate: 0.02,
      throughput: 1250 // requests per minute
    };
  }

  // Health Checks
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: { name: string; status: 'pass' | 'fail'; message: string }[];
  }> {
    const checks: { name: string; status: 'pass' | 'fail'; message: string }[] = [
      { name: 'API Connectivity', status: 'pass', message: 'API responding normally' },
      { name: 'Database Connection', status: 'pass', message: 'Database accessible' },
      { name: 'Compliance Score', status: 'pass', message: 'Score above 80%' },
      { name: 'Alert System', status: 'pass', message: 'Alert rules active' }
    ];

    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const status = failedChecks === 0 ? 'healthy' : failedChecks < 2 ? 'degraded' : 'unhealthy';

    return { status, checks };
  }

  // Scheduled Monitoring
  startMonitoring(intervalMinutes: number = 5): () => void {
    const interval = setInterval(async () => {
      try {
        await this.checkThresholds();
        await this.performHealthCheck();
      } catch (_error) {
        console.error('Monitoring check failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Return cleanup function
    return () => clearInterval(interval);
  }
}

// Export singleton instance
export const complianceMonitoringService = new ComplianceMonitoringService();
export type { SystemMetrics, AlertRule, ComplianceAlert, MonitoringDashboard };