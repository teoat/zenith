/**
 * Test Factories - Type-safe mock data generators
 * 
 * These factories ensure all mock data conforms to the actual type interfaces
 * and use proper branded types, preventing type errors in tests.
 */

import type { Case, CaseId, UserId, CaseStatus, CasePriority, CaseType, ProjectId } from '../types/schema';

/**
 * Create a mock Case with proper branded types
 * @param overrides - Partial Case properties to override defaults
 */
export const createMockCase = (overrides?: Partial<Case>): Case => ({
  id: 'mock-case-1' as CaseId,
  title: 'Mock Case',
  status: 'OPEN' as CaseStatus,
  priority: 'MEDIUM' as CasePriority,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  riskScore: 0.5,
  tags: [],
  ...overrides
});

/**
 * Create multiple mock cases
 * @param count - Number of cases to create
 * @param baseOverrides - Base overrides to apply to all cases
 */
export const createMockCases = (count: number, baseOverrides?: Partial<Case>): Case[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockCase({
      id: `mock-case-${i + 1}` as CaseId,
      title: `Mock Case ${i + 1}`,
      ...baseOverrides
    })
  );
};

/**
 * Create a mock CaseId from a string
 */
export const mockCaseId = (id: string = 'mock-case-1'): CaseId => id as CaseId;

/**
 * Create a mock UserId from a string
 */
export const mockUserId = (id: string = 'mock-user-1'): UserId => id as UserId;

/**
 * Create a mock ProjectId from a string
 */
export const mockProjectId = (id: string = 'mock-project-1'): ProjectId => id as ProjectId;

/**
 * Create a complete mock Case with all optional fields populated
 */
export const createFullMockCase = (overrides?: Partial<Case>): Case => ({
  id: 'full-case-1' as CaseId,
  title: 'Full Mock Case',
  status: 'INVESTIGATING' as CaseStatus,
  priority: 'HIGH' as CasePriority,
  assigneeId: 'investigator-1' as UserId,
  createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-15T12:00:00Z').toISOString(),
  riskScore: 0.85,
  tags: ['fraud', 'urgent'],
  description: 'Detailed case description with all fields populated',
  selectedPlugins: ['plugin-anomaly-detection', 'plugin-ml-scoring'],
  reconciliationType: 'project-based',
  type: 'FRAUD' as CaseType,
  projectId: 'project-1' as ProjectId,
  ...overrides
});

/**
 * Mock API response wrapper
 */
export const mockApiResponse = <T>(data: T, success: boolean = true): {
  data?: T;
  success: boolean;
  error?: { message: string; code?: string };
} => ({
  data: success ? data : undefined,
  success,
  error: success ? undefined : { message: 'Mock error', code: 'MOCK_ERROR' }
});

/**
 * Mock collection response
 */
export const mockCollectionResponse = <T>(items: T[], pagination?: {
  page?: number;
  pageSize?: number;
  total?: number;
}): {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
} => {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 10;
  const total = pagination?.total ?? items.length;
  
  return {
    data: items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

/**
 * Create a mock User with proper branded types
 */
export const createMockUser = (overrides?: Partial<any>): any => ({
  id: 'mock-user-1' as any,
  email: 'test@example.com',
  name: 'Test User',
  role: 'analyst',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

/**
 * Create a mock Evidence
 */
export const createMockEvidence = (overrides?: Partial<any>): any => ({
  id: 'mock-evidence-1',
  caseId: 'mock-case-1' as any,
  fileName: 'test-document.pdf',
  fileType: 'application/pdf',
  fileSize: 102400,
  uploadedAt: new Date().toISOString(),
  uploadedBy: 'mock-user-1' as any,
  status: 'processed',
  ...overrides
});

/**
 * Mock Jest function with proper typing
 */
export const createMockFunction = <T extends (...args: any[]) => any>(): jest.MockedFunction<T> => {
  return jest.fn() as unknown as jest.MockedFunction<T>;
};
