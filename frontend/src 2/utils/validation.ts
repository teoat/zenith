import { z } from 'zod';

/**
 * Comprehensive input validation utilities
 * Implements security best practices and data integrity checks
 */

// Email validation schema
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email too long')
  .transform(val => val.toLowerCase().trim());

// Password validation schema (OWASP recommendations)
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^\w]/, 'Password must contain at least one special character');

// Transaction amount validation
export const amountSchema = z.number()
  .positive('Amount must be positive')
  .max(999999999.99, 'Amount exceeds maximum limit')
  .refine(val => Number.isFinite(val), 'Invalid amount')
  .transform(val => Math.round(val * 100) / 100); // Round to 2 decimals

// Account number validation
export const accountNumberSchema = z.string()
  .min(4, 'Account number too short')
  .max(34, 'Account number too long (IBAN max length)')
  .regex(/^[A-Z0-9]+$/i, 'Account number can only contain letters and numbers')
  .transform(val => val.toUpperCase().trim());

// Case ID validation
export const caseIdSchema = z.string()
  .uuid('Invalid case ID format');

// Date range validation
export const dateRangeSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date()
}).refine(data => data.start <= data.end, {
  message: 'Start date must be before or equal to end date',
  path: ['end']
});

// Search query validation (prevent injection)
export const searchQuerySchema = z.string()
  .max(500, 'Search query too long')
  .regex(/^[a-zA-Z0-9\s@._-]*$/, 'Search contains invalid characters')
  .transform(val => val.trim());

// Risk score validation
export const riskScoreSchema = z.number()
  .min(0, 'Risk score must be between 0 and 100')
  .max(100, 'Risk score must be between 0 and 100');

// URL validation (for evidence links)
export const urlSchema = z.string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .refine(val => {
    try {
      const url = new URL(val);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }, 'Only HTTP and HTTPS URLs are allowed');

// File upload validation
export const fileUploadSchema = z.object({
  name: z.string()
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters'),
  size: z.number()
    .positive('File size must be positive')
    .max(100 * 1024 * 1024, 'File exceeds 100MB limit'),
  type: z.string()
    .regex(/^[a-z]+\/[a-z0-9.+-]+$/i, 'Invalid MIME type')
});

// Transaction validation
export const transactionSchema = z.object({
  amount: amountSchema,
  currency: z.string()
    .length(3, 'Currency code must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Invalid currency code')
    .transform(val => val.toUpperCase()),
  from_account: accountNumberSchema,
  to_account: accountNumberSchema,
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  metadata: z.record(z.unknown()).optional()
});

// Case creation/update validation
export const caseSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title too long'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description too long'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assignee_id: z.string().uuid().optional(),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').optional()
});

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .slice(0, 10000); // Enforce max length
}

/**
 * Validate and sanitize search query
 */
export function validateSearchQuery(query: string): string {
  try {
    return searchQuerySchema.parse(query);
  } catch (_error) {
    throw new Error('Invalid search query');
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate amount is valid number and within limits
 */
export function validateAmount(amount: number | string): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return amountSchema.parse(num);
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): void {
  fileUploadSchema.parse({
    name: file.name,
    size: file.size,
    type: file.type
  });

  // Additional security checks
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'text/plain',
    'application/json'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed`);
  }

  // Check for suspicious file extensions
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.js', '.vbs'];
  if (suspiciousExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
    throw new Error('Suspicious file extension detected');
  }
}

/**
 * Validate form data against schema
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (_error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success:false, errors: { _form: 'Validation failed' } };
  }
}

/**
 * Check if value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validate pagination parameters
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export function validatePagination(params: { page?: number; limit?: number }) {
  return paginationSchema.parse(params);
}
