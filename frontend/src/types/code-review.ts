export interface AnalysisResult {
  risk_score: number;
  confidence: number;
  suggestions: string[];
}
