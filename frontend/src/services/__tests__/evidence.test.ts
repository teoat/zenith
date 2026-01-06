import { describe, it, jest, beforeEach } from '@jest/globals';
import { evidenceService } from '../evidence';

describe('Evidence Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvidence', () => {
    it('should get evidence for a case', async () => {
      const caseId = 'case-123';
      const mockEvidence = [
        { id: 'evidence-1', fileName: 'doc1.pdf', case_id: caseId, uploadedAt: new Date().toISOString() },
        { id: 'evidence-2', fileName: 'doc2.pdf', case_id: caseId, uploadedAt: new Date().toISOString() }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvidence, total: 2 })
      });

      const result = await evidenceService.getEvidence(caseId);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/evidence?case_id=${caseId}`),
        expect.any(Object)
      );
    });

    it('should get all evidence without case filter', async () => {
      const mockEvidence = [
        { id: 'evidence-1', fileName: 'doc1.pdf', case_id: 'case-1', uploadedAt: new Date().toISOString() }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvidence, total: 1 })
      });

      const result = await evidenceService.getEvidence();

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle pagination and query parameters', async () => {
      const mockEvidence = [
        { id: 'evidence-1', fileName: 'doc1.pdf', case_id: 'case-1', uploadedAt: new Date().toISOString() }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvidence, total: 1 })
      });

      await evidenceService.getEvidence('case-1', 2, 10, 'type:pdf');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('case_id=case-1&page=2&page_size=10&q=type:pdf'),
        expect.any(Object)
      );
    });
  });

  describe('uploadEvidence', () => {
    it('should upload evidence successfully', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const caseId = 'case-123';
      const mockResponse = {
        id: 'evidence-123',
        fileName: 'test.txt',
        size: 12,
        type: 'text/plain',
        case_id: caseId,
        uploadedAt: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await evidenceService.uploadEvidence(caseId, file);

      expect(result.id).toBe('evidence-123');
      expect(result.fileName).toBe('test.txt');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/evidence/upload'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });

    it('should handle upload errors', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const caseId = 'case-123';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      await expect(evidenceService.uploadEvidence(caseId, file)).rejects.toThrow('Upload failed');
    });
  });

  describe('processEvidence', () => {
    it('should process evidence file', async () => {
      const filePath = '/path/to/file.pdf';
      const mockResult = { fileType: 'pdf', sizeBytes: 1024 };

      // Mock electron API
      (global.window as any).electronAPI = {
        processEvidence: jest.fn().mockResolvedValue(mockResult)
      };
      (global.window as any).electronAPI.isElectron = true;

      const result = await evidenceService.processEvidence(filePath);

      expect(result).toEqual(mockResult);
      expect((global.window as any).electronAPI.processEvidence).toHaveBeenCalledWith(filePath);
    });

    it('should return fallback for browser environment', async () => {
      // No electron API available
      delete (global.window as any).electronAPI;

      const result = await evidenceService.processEvidence('/path/to/file.pdf');

      expect(result).toEqual({ fileType: 'unknown', sizeBytes: 0 });
    });
  });
});