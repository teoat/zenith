// Compliance Service - Frontend API integration for compliance features
// Handles audit logging, regulatory reporting, incident management, access reviews, and training

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

import { request } from "./client";

class ComplianceService {
  // Base path relative to API_BASE (assumed to be handled by request helper)
  private basePath = "/compliance";

  // Audit Logging
  async logEvent(
    action: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, unknown>,
  ): Promise<{ log_id: string; status: string }> {
    return request<{ log_id: string; status: string }>(
      `${this.basePath}/audit/log`,
      {
        method: "POST",
        body: JSON.stringify({
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
        }),
      },
    );
  }

  // Regulatory Reports
  async createRegulatoryReport(
    reportType: string,
    caseId: string,
    reportData: Record<string, any>,
  ): Promise<{
    report_id: string;
    filing_id: string;
    due_date: string;
    status: string;
  }> {
    return request(`${this.basePath}/regulatory-reports`, {
      method: "POST",
      body: JSON.stringify({
        report_type: reportType,
        case_id: caseId,
        report_data: reportData,
      }),
    });
  }

  async getRegulatoryReports(
    status?: string,
  ): Promise<{ reports: RegulatoryReport[]; total: number }> {
    const query = status ? `?status=${status}` : "";
    return request(`${this.basePath}/regulatory-reports${query}`);
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
    return request(`${this.basePath}/incidents`, {
      method: "POST",
      body: JSON.stringify(incidentData),
    });
  }

  // Access Reviews
  async initiateAccessReview(
    userId: string,
    reviewPeriodMonths: number = 12,
  ): Promise<{ review_id: string; status: string; review_period: string }> {
    return request(`${this.basePath}/access-reviews`, {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        review_period_months: reviewPeriodMonths,
      }),
    });
  }

  // Training
  async recordTrainingCompletion(
    trainingType: string,
    trainingModule: string,
    score?: number,
  ): Promise<{
    record_id: string;
    status: string;
    expiry_date: string;
    certificate_id?: string;
  }> {
    return request(`${this.basePath}/training/complete`, {
      method: "POST",
      body: JSON.stringify({
        training_type: trainingType,
        training_module: trainingModule,
        score,
      }),
    });
  }

  // Dashboard Data
  async getComplianceDashboard(): Promise<ComplianceMetrics> {
    return request(`${this.basePath}/dashboard`);
  }

  async getAuditLogs(
    limit: number = 100,
    offset: number = 0,
  ): Promise<{
    logs: AuditLog[];
    total: number;
    offset: number;
    limit: number;
  }> {
    return request(
      `${this.basePath}/audit/logs?limit=${limit}&offset=${offset}`,
    );
  }

  // Utility Methods
  getComplianceScoreColor(score: number): string {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  }

  getComplianceScoreBgColor(score: number): string {
    if (score >= 90) return "bg-green-100";
    if (score >= 70) return "bg-yellow-100";
    return "bg-red-100";
  }

  getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case "critical":
        return "text-red-700 bg-red-100";
      case "high":
        return "text-orange-700 bg-orange-100";
      case "medium":
        return "text-yellow-700 bg-yellow-100";
      case "low":
        return "text-green-700 bg-green-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  }

  // Regional Compliance
  async getRegionalCompliance(): Promise<{ regions: RegionalCompliance[] }> {
    return request(`${this.basePath}/regional-compliance`);
  }

  async getDataResidencyRules(): Promise<{ rules: DataResidencyRule[] }> {
    return request(`${this.basePath}/data-residency-rules`);
  }

  async setRegionalCompliance(
    region: string,
    framework: string,
    complianceData: Record<string, any>,
  ): Promise<{ status: string }> {
    return request(`${this.basePath}/regional-compliance/${region}`, {
      method: "PUT",
      body: JSON.stringify({
        framework,
        ...complianceData,
      }),
    });
  }

  formatComplianceFlags(flags: string[]): string {
    const flagLabels: Record<string, string> = {
      "FATF-CDD": "FATF Customer Due Diligence",
      "GDPR-Data-Processing": "GDPR Data Processing",
      "GDPR-Data-Protection": "GDPR Data Protection",
      "CCPA-Data-Privacy": "CCPA Data Privacy",
      "CCPA-Data-Security": "CCPA Data Security",
      "SOX-Financial-Reporting": "SOX Financial Reporting",
      "SOX-Internal-Controls": "SOX Internal Controls",
      "PCI-DSS-Payment-Security": "PCI DSS Payment Security",
      "HIPAA-Health-Data": "HIPAA Health Data Protection",
    };

    return flags.map((flag) => flagLabels[flag] || flag).join(", ");
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
}

// Export singleton instance
export const complianceService = new ComplianceService();
export type {
  ComplianceMetrics,
  AuditLog,
  RegulatoryReport,
  SecurityIncident,
  AccessReview,
  TrainingRecord,
  RegionalCompliance,
  DataResidencyRule,
};
