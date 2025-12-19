// API Response Type System - Eliminates 'any' from API responses

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
}

// Specific API response types
export type UserResponse = ApiResponse<import('./schema').User>;
export type UsersResponse = ApiResponse<import('./schema').User[]>;
export type CaseResponse = ApiResponse<import('./schema').Case>;
export type CasesResponse = ApiResponse<import('./schema').Case[]>;
export type EvidenceResponse = ApiResponse<import('./api').EvidenceItem>;
export type EvidenceListResponse = ApiResponse<{
  items: import('./api').EvidenceItem[];
  total: number;
}>;

// Authentication responses
export interface AuthResponse extends ApiResponse<{
  user: import('./schema').User;
  token: string;
  refreshToken?: string;
}> {}

export interface LoginResponse extends ApiResponse<{
  user: import('./schema').User;
  token: string;
  requiresMFA?: boolean;
}> {}

// Generic collection response
export interface CollectionResponse<T> extends ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}> {}

// Error response types
export interface ValidationError extends ApiError {
  field: string;
  value: unknown;
}

export interface NetworkError extends ApiError {
  statusCode: number;
  retryable: boolean;
}

// Utility types for API functions
export type ApiFunction<TInput, TOutput> = (input: TInput) => Promise<ApiResponse<TOutput>>;
export type PaginatedApiFunction<TOutput> = (params: {
  page?: number;
  pageSize?: number;
  query?: string;
}) => Promise<CollectionResponse<TOutput>>;