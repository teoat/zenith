export interface ReportSection {
  id: string;
  title: string;
  type: 'executive_summary' | 'findings' | 'evidence' | 'timeline' | 'recommendations' | 'appendix' | 'subject_info' | 'activity_description' | 'supporting_documentation' | 'factual_background' | 'analysis' | 'remediation' | 'facts' | 'legal_analysis' | 'evidence_summary' | 'conclusions';
  content: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  wordCount?: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  format: 'sar' | 'internal' | 'regulatory' | 'legal' | 'custom';
}

export interface CaseData {
  caseId: string;
  title: string;
  subjects: { name: string; type: string; riskScore: number }[];
  evidenceCount: number;
  transactionTotal: number;
  alertCount: number;
}
