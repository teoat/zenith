export interface CodeIssue {
  file_path: string;
  line_number: number;
  column?: number;
  issue_type: string;
  category:
    | "security"
    | "performance"
    | "maintainability"
    | "reliability"
    | "compliance"
    | "best_practice";
  severity: "info" | "warning" | "error" | "critical";
  title: string;
  description: string;
  code_snippet: string;
  suggestion: string;
  confidence_score: number;
  cwe_id?: string;
  owasp_id?: string;
  references: string[];
}

export interface CodeReviewResult {
  repository: string;
  branch: string;
  commit_hash: string;
  files_analyzed: number;
  total_lines: number;
  quality_score: number;
  quality_rating: "excellent" | "good" | "fair" | "poor" | "critical";
  issues: CodeIssue[];
  metrics: {
    total_issues: number;
    issues_by_category: Record<string, number>;
    issues_by_severity: Record<string, number>;
    avg_issues_per_file: number;
    issues_per_1000_lines: number;
    lines_of_code: number;
    files_analyzed: number;
    test_coverage_estimate: number;
    maintainability_index: number;
    analysis_time_seconds: number;
  };
  generated_at: string;
  analysis_time_seconds: number;
}

export interface TestSuggestion {
  test_type: string;
  description: string;
  code_example: string;
  coverage_areas: string[];
  priority: string;
  complexity: string;
}

export interface AIAnalysisResponse {
  issues: AIIssue[];
  quality_score: number;
  analysis_time_seconds: number;
  success?: boolean;
}

export interface AIIssue {
  file_path: string;
  line_number: number;
  issue_type: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  code_snippet: string;
  suggestion: string;
  confidence_score: number;
  cwe_id?: string;
  owasp_id?: string;
  references?: string[];
}
