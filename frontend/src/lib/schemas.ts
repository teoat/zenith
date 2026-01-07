// Core API Schemas for Type Safety
import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  full_name: z.string().min(1).max(100),
  role: z.enum(['admin', 'manager', 'investigator', 'analyst', 'auditor', 'viewer']),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  mfa_enabled: z.boolean().default(false),
  last_login: z.string().datetime().optional(),
});

// Case schemas  
export const CaseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['OPEN', 'INVESTIGATING', 'CLOSED', 'ARCHIVED']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  case_type: z.enum(['MONEY_LAUNDERING', 'FRAUD_SUSPECTED', 'IDENTITY_THEFT', 'ACCOUNT_TAKEOVER', 'WIRE_FRAUD', 'CHECK_FRAUD', 'CARD_FRAUD']),
  assignee_id: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  closed_at: z.string().datetime().optional(),
  risk_score: z.number().min(0).max(100).default(0),
  fraud_amount: z.number().min(0).default(0),
  customer_name: z.string().max(200).optional(),
});

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
     details: z.record(z.string(), z.any()).optional(),
    timestamp: z.string().optional(),
  }).optional(),
  meta: z.object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    total: z.number().optional(),
    hasMore: z.boolean().optional(),
  }).optional(),
});

// Analysis result schema for CodeReviewDashboard
export const AnalysisResultSchema = z.object({
  total_issues: z.number(),
  issues_by_category: z.object({
    critical: z.number().optional(),
    high: z.number().optional(),
    medium: z.number().optional(),
    low: z.number().optional(),
    info: z.number().optional(),
  }).optional(),
  issues_by_severity: z.object({
    blocking: z.number().optional(),
    major: z.number().optional(),
    minor: z.number().optional(),
    info: z.number().optional(),
  }).optional(),
  avg_issues_per_file: z.number(),
  issues_per_1000_lines: z.number(),
  lines_of_code: z.number(),
  files_analyzed: z.number(),
  test_coverage_estimate: z.number(),
  maintainability_index: z.number(),
  analysis_time_seconds: z.number(),
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type Case = z.infer<typeof CaseSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type AnalysisResultData = z.infer<typeof AnalysisResultSchema>;
export type ApiResponse<T> = z.infer<typeof ApiResponseSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;