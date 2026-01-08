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
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_entities: string[];
  required_action: string;
  deadline: string;
  escalation_level: number;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

export interface ComplianceReport {
  report_id: string;
  framework: string;
  period_start: string;
  period_end: string;
  overall_status: 'compliant' | 'non_compliant' | 'under_review' | 'pending_approval';
  risk_summary: Record<string, number>;
  critical_findings: string[];
  recommendations: string[];
  generated_at: string;
  approved_by?: string;
}
