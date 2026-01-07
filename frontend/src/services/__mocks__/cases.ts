// Mock implementation for cases service
import type { Case } from "@/types/schema";

export const caseService = {
  getCases: jest.fn().mockResolvedValue({
    data: [] as Case[],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    },
  }),
  getCase: jest.fn().mockResolvedValue({ data: {} as Case }),
  createCase: jest.fn().mockResolvedValue({
    data: { id: "new-case", case: {} as Case },
  }),
  updateCase: jest.fn().mockResolvedValue({ data: {} as Case }),
  deleteCase: jest.fn().mockResolvedValue({ message: "Case deleted" }),
  getCaseNotes: jest.fn().mockResolvedValue({ notes: [] }),
  addCaseNote: jest.fn().mockResolvedValue({ note: {} }),
  updateCaseNote: jest.fn().mockResolvedValue({ note: {} }),
  deleteCaseNote: jest.fn().mockResolvedValue({ message: "Note deleted" }),
  getCaseStatistics: jest.fn().mockResolvedValue({
    total: 0,
    open: 0,
    closed: 0,
    inProgress: 0,
  }),
  bulkUpdateCases: jest.fn().mockResolvedValue({ updated: 0 }),
  getCaseById: jest.fn().mockResolvedValue({ data: {} as Case }),
};
