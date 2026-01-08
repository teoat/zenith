export type RuleType = 'velocity' | 'amount' | 'geographic' | 'pattern' | 'time' | 'account';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Rule {
  rule_id: string;
  name: string;
  description: string;
  rule_type: RuleType;
  risk_level: RiskLevel;
  enabled: boolean;
  triggered_count: number;
  created_at: string;
}

export interface RuleParameters {
  max_transactions?: number;
  time_window_minutes?: number;
  threshold_amount?: number;
  allowed_countries?: string[];
  pattern_regex?: string;
  target_accounts?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface NewRule {
  rule_type: RuleType;
  name: string;
  description: string;
  risk_level: RiskLevel;
  parameters: RuleParameters;
}
