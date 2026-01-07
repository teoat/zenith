// Runtime Type Validation - Phase 5 Implementation
// Zod schemas for runtime type checking and validation

import { z } from 'zod';
import { secureLogger } from '@/utils/secureLogger';

// ==========================================
// BASE SCHEMAS
// ==========================================

// UUID validation schema
export const uuidSchema = z.string().uuid();

// Email validation schema
export const emailSchema = z.string().email();

// URL validation schema
export const urlSchema = z.string().url();

// Date string validation
export const dateStringSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date string'
});

// ==========================================
// DOMAIN SCHEMAS
// ==========================================

// User schemas
export const userRoleSchema = z.enum(['admin', 'investigator', 'analyst', 'viewer']);

export const userSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  name: z.string().min(1).max(100),
  role: userRoleSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().default(true),
  lastLogin: z.date().optional(),
});

export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true
});

export const updateUserSchema = createUserSchema.partial();

// Case schemas
export const caseStatusSchema = z.enum(['open', 'in_progress', 'closed', 'suspended']);

export const casePrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const caseSchema = z.object({
  id: z.string().regex(/^CASE-\d{4}-\d{6}$/),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  status: caseStatusSchema,
  priority: casePrioritySchema,
  assigneeId: uuidSchema.optional(),
  createdById: uuidSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  closedAt: z.date().optional(),
  tags: z.array(z.string().max(50)).max(20),
});

export const createCaseSchema = caseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true
});

// Evidence schemas
export const evidenceTypeSchema = z.enum([
  'document', 'image', 'video', 'audio', 'log', 'network', 'memory', 'disk'
]);

export const evidenceStatusSchema = z.enum(['pending', 'processing', 'analyzed', 'failed']);

export const evidenceSchema = z.object({
  id: z.string().regex(/^EVID-\d{4}-\d{6}$/),
  caseId: z.string().regex(/^CASE-\d{4}-\d{6}$/),
  filename: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z.number().positive(),
  hash: z.string().length(64), // SHA-256 hash
  type: evidenceTypeSchema,
  status: evidenceStatusSchema,
  uploadedById: uuidSchema,
  uploadedAt: z.date(),
  analyzedAt: z.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const uploadEvidenceSchema = z.object({
  caseId: z.string().regex(/^CASE-\d{4}-\d{6}$/),
  file: z.instanceof(File),
});

// ==========================================
// API RESPONSE SCHEMAS
// ==========================================

// API response schemas are defined inline for better type safety

// Specific API response schemas
export const userResponseSchema = z.object({
  success: z.boolean(),
  data: userSchema.optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional()
});

export const usersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(userSchema).optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional()
});

export const caseResponseSchema = z.object({
  success: z.boolean(),
  data: caseSchema.optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional()
});

export const casesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(caseSchema).optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional()
});

export const evidenceResponseSchema = z.object({
  success: z.boolean(),
  data: evidenceSchema.optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional()
});

export const evidenceListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(evidenceSchema),
    total: z.number()
  }).optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional()
});

// ==========================================
// VALIDATION UTILITIES
// ==========================================

// Runtime validation function
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: z.ZodError;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

// Type-safe validation wrapper
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => validateData(schema, data);
}

// API response validator
export function validateApiResponse<T>(
  response: unknown,
  dataSchema: z.ZodSchema<T>
): response is { success: true; data: T } | { success: false; error: { code: string; message: string } } {
  // Create a dynamic schema based on the data schema
  const responseSchema = z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.string(), z.unknown()).optional()
    }).optional(),
    meta: z.object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
      total: z.number().optional(),
      hasMore: z.boolean().optional()
    }).optional()
  });

  const result = responseSchema.safeParse(response);
  return result.success;
}

// ==========================================
// DOMAIN VALIDATORS
// ==========================================

// User validators
export const validateUser = createValidator(userSchema);
export const validateCreateUser = createValidator(createUserSchema);
export const validateUpdateUser = createValidator(updateUserSchema);

// Case validators
export const validateCase = createValidator(caseSchema);
export const validateCreateCase = createValidator(createCaseSchema);

// Evidence validators
export const validateEvidence = createValidator(evidenceSchema);
export const validateUploadEvidence = createValidator(uploadEvidenceSchema);

// ==========================================
// TRANSFORMATION UTILITIES
// ==========================================

// Convert API responses to typed data
export function extractApiData<T>(
  response: unknown,
  schema: z.ZodSchema<T>
): T | null {
  const responseSchema = z.object({
    success: z.boolean(),
    data: schema.optional(),
    error: z.object({ code: z.string(), message: z.string() }).optional()
  });

  const validation = validateData(responseSchema, response);
  if (validation.success && validation.data.success && validation.data.data) {
    return validation.data.data;
  }
  return null;
}

// Safe API data extraction with error handling
export function safeExtractApiData<T>(
  response: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const responseSchema = z.object({
      success: z.boolean(),
      data: schema.optional(),
      error: z.object({ code: z.string(), message: z.string() }).optional()
    });

    const validation = validateData(responseSchema, response);
    if (!validation.success) {
      return { success: false, error: 'Invalid response format' };
    }

    const { success, data, error } = validation.data;
    if (!success) {
      return { success: false, error: error?.message || 'API error' };
    }

    if (!data) {
      return { success: false, error: 'No data in response' };
    }

    return { success: true, data };
  } catch (_e) {
    secureLogger.error('VALIDATION', 'Validation failed in safeExtractApiData', {
      error: _e instanceof Error ? _e.message : String(_e)
    });
    return { success: false, error: 'Validation failed' };
  }
}

// ==========================================
// MIDDLEWARE INTEGRATION
// ==========================================

// Express-style middleware for API validation
interface ExpressRequest {
  body: unknown;
  validatedBody?: unknown;
  path?: string;
}

interface ExpressResponse {
  status: (code: number) => ExpressResponse;
  json: (data: unknown) => void;
}

export function createApiValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: ExpressRequest, res: ExpressResponse, next: () => void) => {
    const validation = validateData(schema, req.body);
    if (validation.success) {
      req.validatedBody = validation.data;
      next();
    } else {
      secureLogger.warn('VALIDATION', 'API Validation failed', {
        issues: validation.error.issues,
        path: req.path
      });
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: validation.error.issues }
      });
    }
  };
}

// React Query integration
export function createQueryValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    const validation = validateData(schema, data);
    if (validation.success) {
      return validation.data;
    }
    throw new Error(`Invalid data: ${validation.error.message}`);
  };
}