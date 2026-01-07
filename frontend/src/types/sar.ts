export interface SARFormData {
  case_id: string;
  suspicious_activities: string[];
  transaction_amount: number;
  transaction_count: number;
  description: string;
  involved_parties: string[];
  geographic_location: string;
  regulatory_basis: string;
  risk_level: "low" | "medium" | "high" | "critical";
  deadline_days: number;
  additional_notes: string;
}

export const SUSPICIOUS_ACTIVITY_TYPES = [
  "Structuring",
  "Money Laundering",
  "Terrorist Financing",
  "Fraud",
  "Identity Theft",
  "Smurfing",
  "Unusual Transaction Patterns",
  "High-Risk Geographic Areas",
  "PEP Involvement",
  "Sanctions Evasion",
  "Unexplained Wealth",
  "Cash Intensive Business",
];

export const REGULATORY_BASES = [
  "BSA/AML - Suspicious Transaction Reporting",
  "PATRIOT Act - Section 314(a)",
  "OFAC Sanctions",
  "EU AML Directive 5",
  "FATF Recommendations",
  "Local AML Regulations",
];
