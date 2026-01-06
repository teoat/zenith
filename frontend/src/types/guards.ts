/**
 * Checks if a value is defined (not null and not undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Checks if a value is a non-empty string
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks if a value is a valid number (not NaN, not Infinity)
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Checks if a value is a plain object
 */
export function isObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if an error is an instance of Error
 */
export function isError(error: any): error is Error {
  return error instanceof Error;
}

/**
 * Type guard for API error responses
 */
export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

export function isApiErrorResponse(error: any): error is ApiErrorResponse {
  return (
    isObject(error) &&
    typeof error.message === 'string'
  );
}
