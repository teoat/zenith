/**
 * branded-types.ts
 * Provides nominal typing for IDs and other critical strings
 * to prevent accidental mixing of different identifier types.
 */

export type Brand<K, T> = K & { readonly __brand: T };

export type CaseId = Brand<string, 'CaseId'>;
export type UserId = Brand<string, 'UserId'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type TransactionId = Brand<string, 'TransactionId'>;
export type EvidenceId = Brand<string, 'EvidenceId'>;
export type AlertId = Brand<string, 'AlertId'>;

// Helper to cast strings to branded types where safe/necessary
export const asCaseId = (id: string) => id as CaseId;
export const asUserId = (id: string) => id as UserId;
export const asProjectId = (id: string) => id as ProjectId;
export const asTransactionId = (id: string) => id as TransactionId;
export const asEvidenceId = (id: string) => id as EvidenceId;
export const asAlertId = (id: string) => id as AlertId;
