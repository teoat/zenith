// API Response Type System - Eliminates 'any' from API responses

// Discriminated union for API responses
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse<T>;

export interface SuccessResponse<T> {
  type: "success";
  data: T;
  meta?: ApiMeta;
}

export interface ErrorResponse<T = unknown> {
  type: "error";
  error: ApiError;
  data?: T; // Optional partial data on error
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
export type UserResponse = ApiResponse<import("./schema").User>;
export type UsersResponse = ApiResponse<import("./schema").User[]>;
export type CaseResponse = ApiResponse<import("./schema").Case>;
export type CasesResponse = ApiResponse<import("./schema").Case[]>;
export type EvidenceResponse = ApiResponse<import("./api").EvidenceItem>;
export type EvidenceListResponse = ApiResponse<{
  items: import("./api").EvidenceItem[];
  total: number;
}>;

// Authentication responses
export type AuthResponse = ApiResponse<{
  user: import("./schema").User;
  token: string;
  refreshToken?: string;
}>;

export type LoginResponse = ApiResponse<{
  user: import("./schema").User;
  token: string;
  requiresMFA?: boolean;
}>;

// Generic collection response
export type CollectionResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  filter: string;
  page: number;
  pageSize: number;
}>;

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
export type ApiFunction<TInput, TOutput> = (
  input: TInput,
) => Promise<ApiResponse<TOutput>>;
export type PaginatedApiFunction<TOutput> = (params: {
  page?: number;
  pageSize?: number;
  query?: string;
}) => Promise<CollectionResponse<TOutput>>;
