// Types and interfaces for Advanced Compliance Dashboard
export interface ComplianceRule {
  rule_id: string;
  framework: string;
  title: string;
  description: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  check_frequency: string;
  automated_check: boolean;
  manual_review_required: boolean;
  remediation_steps: string[];
  reference_links: string[];
}

export interface ComplianceCheck {
  check_id: string;
  rule_id: string;
  entity_id: string;
  entity_type: string;
  status: 'compliant' | 'non_compliant' | 'under_review' | 'pending_approval';
  risk_score: number;
  findings: string[];
  recommendations: string[];
  checked_at: string;
  next_check_due: string;
  reviewer_id?: string;
  review_notes?: string;
}

export interface RegulatoryAlert {
  alert_id: string;
  framework: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_entities: string[];
  required_action: string;
  deadline: string;
  escalation_level: number;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  updated_at?: string;
}

export interface ComplianceReport {
  report_id: string;
  title?: string;
  framework: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  overall_status: 'compliant' | 'non_compliant' | 'under_review' | 'pending_approval';
  compliance_score?: number;
  total_checks?: number;
  passed_checks?: number;
  failed_checks?: number;
  critical_findings: string[];
  risk_summary: Record<string, number>;
  recommendations: string[];
  executive_summary?: string;
  approved_by?: string;
}