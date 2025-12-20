import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { evidenceService } from '../evidence';

global.fetch = jest.fn();

describe('EvidenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadEvidence', () => {
    it('should upload evidence file successfully', async () => {
      const file = new File(['test content'], 'evidence.pdf', { type: 'application/pdf' });
      const caseId = 'case-123';

      const mockResponse = {
        id: 'evidence-456',
        filename: 'evidence.pdf',
        size: file.size,
        type: file.type,
        case_id: caseId,
        uploaded_at: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await evidenceService.uploadEvidence(caseId, file);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/evidence/upload'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should handle file size validation', async () => {
      const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.pdf');
      const caseId = 'case-123';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: async () => ({ detail: 'File too large' })
      });

      await expect(
        evidenceService.uploadEvidence(caseId, largeFile)
      ).rejects.toThrow();
    });

    it('should include metadata in upload', async () => {
      const file = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
      const caseId = 'case-123';
      const metadata = {
        source: 'Bank Statement',
        date: '2025-01-01',
        tags: ['financial', 'transaction']
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'evidence-1', ...metadata })
      });

      await evidenceService.uploadEvidence(caseId, file, metadata);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const formData = callArgs[1].body as FormData;
      expect(formData.get('file')).toBe(file);
    });
  });

  describe('getEvidence', () => {
    it('should fetch evidence by ID', async () => {
      const evidenceId = 'evidence-123';
      const mockEvidence = {
        id: evidenceId,
        filename: 'document.pdf',
        size: 1024,
        type: 'application/pdf',
        case_id: 'case-456',
        uploaded_at: '2025-01-01T00:00:00Z'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvidence
      });

      const evidence = await evidenceService.getEvidence(evidenceId);

      expect(evidence).toEqual(mockEvidence);
    });

    it('should handle evidence not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(evidenceService.getEvidence('nonexistent')).rejects.toThrow();
    });
  });

  describe('getEvidence', () => {
    it('should list all evidence for a case', async () => {
      const caseId = 'case-123';
      const mockEvidence = [
        { id: 'evidence-1', filename: 'doc1.pdf', case_id: caseId },
        { id: 'evidence-2', filename: 'doc2.pdf', case_id: caseId },
        { id: 'evidence-3', filename: 'doc3.pdf', case_id: caseId }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvidence, total: 3 })
      });

      const result = await evidenceService.getEvidence(caseId);

      expect(result.items).toHaveLength(3);
      expect(result.items).toEqual(mockEvidence);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/evidence?case_id=${caseId}`),
        expect.any(Object)
      );
    });

    it('should filter evidence by type', async () => {
      const caseId = 'case-123';
      const type = 'image';
      const mockEvidence = [
        { id: 'evidence-1', filename: 'doc1.pdf', type: 'image', case_id: caseId }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvidence, total: 1 })
      });

      await evidenceService.getEvidence(caseId, 1, 20, `type:${type}`);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`q=type:${type}`),
        expect.any(Object)
      );
    });
  });

      const result = await evidenceService.getEvidence(caseId);

      expect(result.items).toHaveLength(3);
      expect(result.items).toEqual(mockEvidence);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/evidence?case_id=${caseId}`),
        expect.any(Object)
      );
    });

    it('should filter evidence by type', async () => {
      const caseId = 'case-123';
      const type = 'document';
      const mockEvidence = [
        { id: 'evidence-1', filename: 'doc1.pdf', type: 'document', case_id: caseId }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvidence, total: 1 })
      });

      await evidenceService.getEvidence(caseId, 1, 20, `type:${type}`);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`q=type:${type}`),
        expect.any(Object)
      );
    });
  });

  describe('getEvidence', () => {
    it('should list all evidence for a case', async () => {
      const caseId = 'case-123';
      const mockEvidence = [
        { id: 'evidence-1', filename: 'doc1.pdf', case_id: caseId },
        { id: 'evidence-2', filename: 'doc2.pdf', case_id: caseId },
        { id: 'evidence-3', filename: 'doc3.pdf', case_id: caseId }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvidence, total: 3 })
      });

      const result = await evidenceService.getEvidence(caseId);

      expect(result.items).toHaveLength(3);
      expect(result.items).toEqual(mockEvidence);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/evidence?case_id=${caseId}`),
        expect.any(Object)
      );
    });

    it('should filter evidence by type', async () => {
      const caseId = 'case-123';
      const type = 'image';
      const mockEvidence = [
        { id: 'evidence-1', filename: 'doc1.pdf', type: 'image', case_id: caseId }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockEvidence, total: 1 })
      });

      await evidenceService.getEvidence(caseId, 1, 20, `type:${type}`);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`q=type:${type}`),
        expect.any(Object)
      );
    });
  });

  describe('deleteEvidence', () => {
    it('should delete evidence', async () => {
      const evidenceId = 'evidence-123';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Evidence deleted' })
      });

      await expect(evidenceService.deleteEvidence(evidenceId)).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/evidence/${evidenceId}`),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('downloadEvidence', () => {
    it('should download evidence file', async () => {
      const evidenceId = 'evidence-123';
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
        headers: new Headers({
          'content-disposition': 'attachment; filename="document.pdf"'
        })
      });

      const blob = await evidenceService.downloadEvidence(evidenceId);

      expect(blob).toEqual(mockBlob);
    });
  });

  describe('analyzeEvidence', () => {
    it('should analyze evidence with AI', async () => {
      const evidenceId = 'evidence-123';
      const mockAnalysis = {
        entities: ['John Doe', '$5000', 'Bank of America'],
        keywords: ['fraud', 'transaction', 'suspicious'],
        confidence: 0.85,
        summary: 'Potential fraudulent transaction detected'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysis
      });

      const analysis = await evidenceService.analyzeEvidence(evidenceId);

      expect(analysis).toEqual(mockAnalysis);
      expect(analysis.confidence).toBeGreaterThan(0);
    });
  });

  describe('tagEvidence', () => {
    it('should add tags to evidence', async () => {
      const evidenceId = 'evidence-123';
      const tags = ['financial', 'bank-statement', 'Q1-2025'];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: evidenceId, tags })
      });

      const result = await evidenceService.tagEvidence(evidenceId, tags);

      expect(result.tags).toEqual(tags);
    });

    it('should handle duplicate tags gracefully', async () => {
      const evidenceId = 'evidence-123';
      const tags = ['tag1', 'tag1', 'tag2'];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: evidenceId, tags: ['tag1', 'tag2'] })
      });

      const result = await evidenceService.tagEvidence(evidenceId, tags);

      expect(result.tags).toHaveLength(2);
    });
  });

  describe('ocrExtract', () => {
    it('should extract text from image evidence', async () => {
      const evidenceId = 'evidence-123';
      const mockOcrResult = {
        text: 'Extracted text from document',
        confidence: 0.92,
        language: 'en',
        blocks: [
          { text: 'Line 1', confidence: 0.95 },
          { text: 'Line 2', confidence: 0.89 }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOcrResult
      });

      const result = await evidenceService.ocrExtract(evidenceId);

      expect(result.text).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('chainOfCustody', () => {
    it('should retrieve chain of custody', async () => {
      const evidenceId = 'evidence-123';
      const mockChain = [
        { timestamp: '2025-01-01T10:00:00Z', action: 'uploaded', user: 'user1' },
        { timestamp: '2025-01-01T11:00:00Z', action: 'analyzed', user: 'ai-system' },
        { timestamp: '2025-01-01T12:00:00Z', action: 'reviewed', user: 'user2' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockChain
      });

      const chain = await evidenceService.getChainOfCustody(evidenceId);

      expect(chain).toHaveLength(3);
      expect(chain[0].action).toBe('uploaded');
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify evidence integrity', async () => {
      const evidenceId = 'evidence-123';
      const mockVerification = {
        valid: true,
        hash: 'abc123def456',
        verified_at: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVerification
      });

      const result = await evidenceService.verifyIntegrity(evidenceId);

      expect(result.valid).toBe(true);
      expect(result.hash).toBeTruthy();
    });

    it('should detect tampered evidence', async () => {
      const evidenceId = 'tampered-evidence';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: false,
          hash: 'modified',
          error: 'Hash mismatch detected'
        })
      });

      const result = await evidenceService.verifyIntegrity(evidenceId);

      expect(result.valid).toBe(false);
    });
  });
