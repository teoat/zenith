import { z } from 'zod';

/**
 * Core User Schema
 */
export const UserSchema = z.object({
  id: z.string().uuid().or(z.string()),
  email: z.string().email(),
  full_name: z.string(),
  role: z.enum(['ADMIN', 'INVESTIGATOR', 'ANALYST', 'VIEWER']),
  created_at: z.string().datetime(),
  is_active: z.boolean().default(true),
  preferences: z.record(z.any()).optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Core Case Schema
 */
export const CaseSchema = z.object({
  id: z.string().uuid().or(z.string()),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'INVESTIGATING', 'ARCHIVED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignee_id: z.string().uuid().or(z.string()).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

export type Case = z.infer<typeof CaseSchema>;

/**
 * Health Check Schema
 */
export const HealthCheckSchema = z.object({
  component: z.string(),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  latency_ms: z.number().optional(),
  last_check: z.string().datetime(),
  details: z.record(z.any()).optional(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

/**
 * API Response Generic Schema Builder
 */
export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.discriminatedUnion('success', [
    z.object({
      success: z.literal(true),
      data: dataSchema,
      metadata: z.record(z.any()).optional(),
    }),
    z.object({
      success: z.literal(false),
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.any()).optional(),
      }),
    }),
  ]);
}
