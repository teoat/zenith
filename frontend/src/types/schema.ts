export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'INVESTIGATING' | 'ADJUDICATION' | 'CLOSED' | 'ARCHIVED';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CaseType = 'FRAUD' | 'AML' | 'COMPLIANCE' | 'OTHER';
export type TransactionType = 'DEBIT' | 'CREDIT';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AlertStatus = 'NEW' | 'INVESTIGATING' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE';
export type UserRole = 'ANALYST' | 'SENIOR_INVESTIGATOR' | 'ADMIN' | 'MANAGER';

export interface Case {
  id: string;
  title: string;
  status: CaseStatus;
  priority: CasePriority;
  assigneeId?: string;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
  riskScore: number;
  tags: string[];
  description?: string;
  selectedPlugins?: string[]; // New: List of selected plugin IDs
  reconciliationType?: 'project-based' | 'general'; // New: Type of reconciliation
  type?: CaseType;
}

export interface Transaction {
  id: string;
  sourceId: string;
  date: string; // ISO Date String
  amount: number;
  currency: string;
  description: string;
  merchantName?: string;
  category: string;
  type: TransactionType;
  metadata?: Record<string, unknown>;
  riskScore?: number;
  isFlagged?: boolean;
}

export interface Evidence {
  id: string;
  caseId: string;
  filename: string;
  fileType: string;
  sizeBytes: number;
  uploadedAt: string; // ISO Date String
  hash: string;
  isAdmissible: boolean;
  status?: 'pending' | 'processed' | 'analyzed'; // Added for UI state
  riskScore?: number; // Added for UI display
}

export interface Alert {
  id: string;
  caseId: string;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  score: number;
  description: string;
  relatedTransactionIds: string[];
  timestamp?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  preferences?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type CaseId = string;
export type UserId = string;
export type ProjectId = string;
