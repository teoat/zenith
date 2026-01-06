// Mock implementation for evidence service
export const evidenceService = {
  getEvidenceByCaseId: jest.fn().mockResolvedValue({
    data: [],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    }
  }),
  uploadEvidence: jest.fn().mockResolvedValue({
    data: {
      id: 'evidence-1',
      filename: 'test.pdf',
      caseId: 'case-1'
    }
  }),
  deleteEvidence: jest.fn().mockResolvedValue({ message: 'Evidence deleted' }),
  updateEvidence: jest.fn().mockResolvedValue({ data: {} }),
  getEvidenceById: jest.fn().mockResolvedValue({ data: {} })
};