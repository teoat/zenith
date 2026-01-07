// Advanced Type Patterns - Phase 4 Implementation
// Branded types, conditional types, and template literals for domain safety

import type { ApiResponse } from "./api-responses";
import type { User, Case, Evidence } from "./schema";

// ==========================================
// BRANDED TYPES - Domain-Specific IDs
// ==========================================

// Base branded type utility
declare const brand: unique symbol;
export type Brand<T, Brand> = T & { readonly [brand]: Brand };

// Domain-specific ID types
export type UserId = Brand<string, "UserId">;
export type CaseId = Brand<string, "CaseId">;
export type EvidenceId = Brand<string, "EvidenceId">;
export type SessionId = Brand<string, "SessionId">;
export type FileId = Brand<string, "FileId">;

// Utility functions for branded types
export const createUserId = (id: string): UserId => id as UserId;
export const createCaseId = (id: string): CaseId => id as CaseId;
export const createEvidenceId = (id: string): EvidenceId => id as EvidenceId;
export const createSessionId = (id: string): SessionId => id as SessionId;
export const createFileId = (id: string): FileId => id as FileId;

// Type guards for branded types
export const isUserId = (value: unknown): value is UserId => {
  return typeof value === "string" && value.length > 0;
};

export const isCaseId = (value: unknown): value is CaseId => {
  return typeof value === "string" && value.length > 0;
};

export const isEvidenceId = (value: unknown): value is EvidenceId => {
  return typeof value === "string" && value.length > 0;
};

// ==========================================
// CONDITIONAL TYPES - Complex API Responses
// ==========================================

// Extract data type from API response
export type ApiResponseData<T> = T extends ApiResponse<infer U> ? U : never;

// Check if a type is an API response
export type IsApiResponse<T> = T extends ApiResponse ? true : false;

// Advanced pattern types removed due to conflicts with api-responses.ts

// ==========================================
// TEMPLATE LITERAL TYPES - Dynamic Routes
// ==========================================

// API endpoint templates
export type ApiEndpoint = `/${string}`;
export type FullApiUrl<T extends ApiEndpoint> = `${string}${T}`;

// Specific API route types
export type UserApiRoutes = `/${"users" | "profile" | "auth"}`;
export type CaseApiRoutes =
  `/${"cases" | "cases/${string}" | "cases/${string}/evidence"}`;
export type EvidenceApiRoutes =
  `/${"evidence" | "evidence/${string}" | "evidence/${string}/analyze"}`;

// HTTP method + route combinations
export type ApiRoute = `${"GET" | "POST" | "PUT" | "DELETE"} ${ApiEndpoint}`;

// ==========================================
// ADVANCED GENERIC CONSTRAINTS
// ==========================================

// Constrain to objects with required properties
export type HasRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Constrain to objects with optional properties
export type HasOptional<T, K extends keyof T> = T & Partial<Pick<T, K>>;

// Constrain to objects that extend a base interface
export type Extends<T, U> = T extends U ? T : never;

// Constrain to non-nullable types
export type NonNullable<T> = T extends null | undefined ? never : T;

// Advanced constraint for API entities
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EntityWithId<T extends BaseEntity> = HasRequired<T, "id">;
export type TimestampedEntity<T extends BaseEntity> = HasRequired<
  T,
  "createdAt" | "updatedAt"
>;

// ==========================================
// DOMAIN-SPECIFIC TYPE UTILITIES
// ==========================================

// Status types for different domains
export type CaseStatus = "open" | "in_progress" | "closed" | "suspended";
export type EvidenceStatus = "pending" | "processing" | "analyzed" | "failed";
export type UserRole = "admin" | "investigator" | "analyst" | "viewer";

// Status transition constraints
export type NextCaseStatus<Current extends CaseStatus> = Current extends "open"
  ? "in_progress" | "closed"
  : Current extends "in_progress"
    ? "closed" | "suspended"
    : Current extends "suspended"
      ? "in_progress" | "closed"
      : never;

// Action permissions based on user role
export type UserPermissions<T extends UserRole> = T extends "admin"
  ? readonly ["read", "write", "delete", "admin"]
  : T extends "investigator"
    ? readonly ["read", "write", "analyze"]
    : T extends "analyst"
      ? readonly ["read", "analyze"]
      : T extends "viewer"
        ? readonly ["read"]
        : never;

// ==========================================
// TYPE-LEVEL COMPUTATIONS
// ==========================================

// Union to intersection conversion
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

// Extract keys of certain value types
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Extract function signatures from object
export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

// Create readonly version of selected keys
export type ReadonlyKeys<T, K extends keyof T> = Omit<T, K> &
  Readonly<Pick<T, K>>;

// ==========================================
// PRACTICAL USAGE EXAMPLES
// ==========================================

// Example: Strongly typed API client
export interface TypedApiClient {
  getUser(id: UserId): Promise<ApiResponse<User>>;
  getCase(id: CaseId): Promise<ApiResponse<Case>>;
  updateCase(id: CaseId, data: Partial<Case>): Promise<ApiResponse<Case>>;
  uploadEvidence(caseId: CaseId, file: File): Promise<ApiResponse<Evidence>>;
}

// Example: Domain-specific validation
export const validateUserId = (id: unknown): id is UserId => {
  return typeof id === "string" && id.length >= 8 && id.length <= 36;
};

export const validateCaseId = (id: unknown): id is CaseId => {
  return typeof id === "string" && /^CASE-\d{4}-\d{6}$/.test(id);
};

// Example: Type-safe route generation
export const createApiUrl = <T extends ApiEndpoint>(
  baseUrl: string,
  endpoint: T,
): FullApiUrl<T> => {
  return `${baseUrl}${endpoint}` as FullApiUrl<T>;
};
