import { ComplianceRule, ComplianceCheck, RegulatoryAlert, ComplianceReport } from '@/types/compliance';

interface ComplianceMetrics {
  recent_audit_events: number;
  pending_regulatory_reports: number;
  open_security_incidents: number;
  overdue_access_reviews: number;
  expiring_training_records: number;
  high_risk_events_last_100: number;
  overall_compliance_score: number;
}

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  user_id: string;
  timestamp: string;
  compliance_flags: string[];
  risk_score: number;
}

interface RegulatoryReport {
  id: string;
  report_type: string;
  report_id: string;
  case_id: string;
  filing_status: string;
  due_date: string;
  regulatory_body: string;
  created_at: string;
}

interface SecurityIncident {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  affected_systems: string[];
  affected_users: number;
  data_exposed: Record<string, any>;
  detected_by: string;
  created_at: string;
}

interface AccessReview {
  id: string;
  user_id: string;
  reviewer_id: string;
  review_status: string;
  overall_risk_assessment: string;
  next_review_date: string;
}

interface TrainingRecord {
  id: string;
  training_type: string;
  training_module: string;
  completion_status: string;
  completion_date: string;
  expiry_date: string;
  score?: number;
}

interface RegionalCompliance {
  region: string;
  framework: string;
  compliance_score: number;
  last_audit_date: string;
  next_audit_date: string;
  critical_findings: number;
  data_residency_requirements: string[];
  reporting_frequency: string;
}

interface DataResidencyRule {
  region: string;
  data_types: string[];
  residency_requirements: string;
  encryption_requirements: string;
  retention_periods: Record<string, number>;
}

class ComplianceService {
  private baseUrl = '/api/v1/compliance';

  // Audit Logging
  async logEvent(
    action: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any>
  ): Promise<{ log_id: string; status: string }> {
    const response = await fetch(`${this.baseUrl}/audit/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details
      })
    });

    if (!response.ok) {
      throw new Error('Failed to log compliance event');
    }

    return response.json();
  }

  // Regulatory Reports
  async createRegulatoryReport(
    reportType: string,
    caseId: string,
    reportData: Record<string, any>
  ): Promise<{ report_id: string; filing_id: string; due_date: string; status: string }> {
    const response = await fetch(`${this.baseUrl}/regulatory-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        report_type: reportType,
        case_id: caseId,
        report_data: reportData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create regulatory report');
    }

    return response.json();
  }

  async getRegulatoryReports(status?: string): Promise<{ reports: RegulatoryReport[]; total: number }> {
    const url = status
      ? `${this.baseUrl}/regulatory-reports?status=${status}`
      : `${this.baseUrl}/regulatory-reports`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch regulatory reports');
    }

    return response.json();
  }

  // Security Incidents
  async submitSecurityIncident(incidentData: {
    type: string;
    severity: string;
    title: string;
    description: string;
    affected_systems?: string[];
    affected_users?: number;
    data_exposed?: Record<string, any>;
  }): Promise<{ incident_id: string; status: string; severity: string }> {
    const response = await fetch(`${this.baseUrl}/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(incidentData)
    });

    if (!response.ok) {
      throw new Error('Failed to submit security incident');
    }

    return response.json();
  }

  // Access Reviews
  async initiateAccessReview(
    userId: string,
    reviewPeriodMonths: number = 12
  ): Promise<{ review_id: string; status: string; review_period: string }> {
    const response = await fetch(`${this.baseUrl}/access-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        user_id: userId,
        review_period_months: reviewPeriodMonths
      })
    });

    if (!response.ok) {
      throw new Error('Failed to initiate access review');
    }

    return response.json();
  }

  // Training
  async recordTrainingCompletion(
    trainingType: string,
    trainingModule: string,
    score?: number
  ): Promise<{ record_id: string; status: string; expiry_date: string; certificate_id?: string }> {
    const response = await fetch(`${this.baseUrl}/training/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        training_type: trainingType,
        training_module: trainingModule,
        score
      })
    });

    if (!response.ok) {
      throw new Error('Failed to record training completion');
    }

    return response.json();
  }

  // Dashboard Data
  async getComplianceDashboard(): Promise<ComplianceMetrics> {
    const response = await fetch(`${this.baseUrl}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch compliance dashboard data');
    }

    return response.json();
  }

  async getAuditLogs(limit: number = 100, offset: number = 0): Promise<{
    logs: AuditLog[];
    total: number;
    offset: number;
    limit: number;
  }> {
    const response = await fetch(`${this.baseUrl}/audit/logs?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }

    return response.json();
  }

  // Utility Methods
  getComplianceScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  getComplianceScoreBgColor(score: number): string {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  }

  getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  }

  // Regional Compliance
  async getRegionalCompliance(): Promise<{ regions: RegionalCompliance[] }> {
    const response = await fetch(`${this.baseUrl}/regional-compliance`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch regional compliance data');
    }

    return response.json();
  }

  async getDataResidencyRules(): Promise<{ rules: DataResidencyRule[] }> {
    const response = await fetch(`${this.baseUrl}/data-residency-rules`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data residency rules');
    }

    return response.json();
  }

  async setRegionalCompliance(region: string, framework: string, complianceData: Record<string, any>): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/regional-compliance/${region}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        framework,
        ...complianceData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update regional compliance');
    }

    return response.json();
  }

  formatComplianceFlags(flags: string[]): string {
    const flagLabels: Record<string, string> = {
      'FATF-CDD': 'FATF Customer Due Diligence',
      'GDPR-Data-Processing': 'GDPR Data Processing',
      'GDPR-Data-Protection': 'GDPR Data Protection',
      'CCPA-Data-Privacy': 'CCPA Data Privacy',
      'CCPA-Data-Security': 'CCPA Data Security',
      'SOX-Financial-Reporting': 'SOX Financial Reporting',
      'SOX-Internal-Controls': 'SOX Internal Controls',
      'PCI-DSS-Payment-Security': 'PCI DSS Payment Security',
      'HIPAA-Health-Data': 'HIPAA Health Data Protection'
    };

    return flags.map(flag => flagLabels[flag] || flag).join(', ');
  }

  isReportOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  // Advanced Compliance Methods
  async getComplianceRules(): Promise<ComplianceRule[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rules`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) return (await response.json()).rules;
      throw new Error();
    } catch {
      // Return mock data as fallback
      return [
        {
          rule_id: 'kyc_verification',
          framework: 'us_patriot_act',
          title: 'Customer Identification and Verification',
          description: 'Verify customer identity using documentary evidence',
          risk_level: 'high',
          check_frequency: 'real-time',
          automated_check: true,
          manual_review_required: true,
          remediation_steps: [
            'Collect additional identification documents',
            'Verify identity through trusted third parties',
            'Enhanced due diligence for high-risk customers'
          ],
          reference_links: ['https://www.finra.org/rules-guidance/key-topics/know-your-customer']
        },
        {
          rule_id: 'transaction_monitoring',
          framework: 'amld5',
          title: 'Suspicious Transaction Monitoring',
          description: 'Monitor transactions for suspicious patterns and report SARs',
          risk_level: 'critical',
          check_frequency: 'real-time',
          automated_check: true,
          manual_review_required: true,
          remediation_steps: ['File SAR', 'Freeze transactions'],
          reference_links: []
        }
      ] as ComplianceRule[];
    }
  }

  async getComplianceChecks(): Promise<ComplianceCheck[]> {
    try {
      const response = await fetch(`${this.baseUrl}/checks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) return (await response.json()).checks;
      throw new Error();
    } catch {
      return [
        {
          check_id: 'check_kyc_verification_cust_123_1703123456',
          rule_id: 'kyc_verification',
          entity_id: 'cust_123',
          entity_type: 'customer',
          status: 'compliant',
          risk_score: 0.15,
          findings: [],
          recommendations: [],
          checked_at: '2025-12-10T10:30:00Z',
          next_check_due: '2025-12-11T10:30:00Z'
        },
        {
          check_id: 'check_transaction_monitoring_txn_456_1703123456',
          rule_id: 'transaction_monitoring',
          entity_id: 'txn_456',
          entity_type: 'transaction',
          status: 'non_compliant',
          risk_score: 0.85,
          findings: ['Suspicious transaction pattern detected'],
          recommendations: ['File Suspicious Activity Report (SAR)'],
          checked_at: '2025-12-10T09:15:00Z',
          next_check_due: '2025-12-10T10:15:00Z'
        }
      ] as ComplianceCheck[];
    }
  }

  async getRegulatoryAlerts(): Promise<RegulatoryAlert[]> {
    try {
      const response = await fetch(`${this.baseUrl}/alerts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) return (await response.json()).alerts;
      throw new Error();
    } catch {
      return [
        {
          alert_id: 'alert_check_transaction_monitoring_txn_456_1703123456',
          framework: 'amld5',
          severity: 'critical',
          title: 'Compliance Violation: Suspicious Transaction Monitoring',
          description: 'Non-compliant finding in transaction txn_456',
          affected_entities: ['txn_456'],
          required_action: 'Review and remediate compliance violation',
          deadline: '2025-12-17T09:15:00Z',
          escalation_level: 1,
          created_at: '2025-12-10T09:15:00Z'
        }
      ] as RegulatoryAlert[];
    }
  }

  async getComplianceReports(): Promise<ComplianceReport[]> {
    try {
      const response = await fetch(`${this.baseUrl}/reports`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) return (await response.json()).reports;
      throw new Error();
    } catch {
      return [
        {
          report_id: 'report_us_patriot_act_1703123456',
          framework: 'us_patriot_act',
          period_start: '2025-11-10T00:00:00Z',
          period_end: '2025-12-10T00:00:00Z',
          overall_status: 'compliant',
          risk_summary: { low: 5, medium: 3, high: 2, critical: 0 },
          critical_findings: [],
          recommendations: ['Continue regular compliance training'],
          generated_at: '2025-12-10T08:00:00Z'
        }
      ] as ComplianceReport[];
    }
  }

  async runComplianceCheck(ruleId: string, entityId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/run-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ rule_id: ruleId, entity_id: entityId })
    });

    if (!response.ok) {
      throw new Error('Failed to run compliance check');
    }
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to acknowledge alert');
    }
  }
}

// Export singleton instance
export const complianceService = new ComplianceService();
export type { ComplianceMetrics, AuditLog, RegulatoryReport, SecurityIncident, AccessReview, TrainingRecord, RegionalCompliance, DataResidencyRule };