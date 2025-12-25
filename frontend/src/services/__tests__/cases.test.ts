import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { caseService } from '../cases';

global.fetch = jest.fn();

describe('CaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCases', () => {
    it('should fetch all cases successfully', async () => {
      const mockCases = [
        {
          id: '1',
          title: 'Test Case 1',
          status: ' open',
          priority: 'high',
          created_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'Test Case 2',
          status: 'closed',
          priority: 'low',
          created_at: '2025-01-02T00:00:00Z'
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCases
      });

      const cases = await caseService.getAllCases();

      expect(cases).toEqual(mockCases);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cases'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(caseService.getAllCases()).rejects.toThrow();
    });

    it('should include filters in query params', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await caseService.getAllCases({ status: 'open', priority: 'high' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=open'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('priority=high'),
        expect.any(Object)
      );
    });
  });

  describe('getCaseById', () => {
    it('should fetch a single case by ID', async () => {
      const mockCase = {
        id: '123',
        title: 'Specific Case',
        status: 'in_progress',
        priority: 'medium',
        description: 'Test description',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCase
      });

      const caseData = await caseService.getCaseById('123');

      expect(caseData).toEqual(mockCase);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cases/123'),
        expect.any(Object)
      );
    });

    it('should handle case not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(caseService.getCaseById('nonexistent')).rejects.toThrow();
    });
  });

  describe('createCase', () => {
    it('should create a new case', async () => {
      const newCase = {
        title: 'New Fraud Case',
        priority: 'high' as const,
        description: 'Suspected fraud activity'
      };

      const mockResponse = {
        ...newCase,
        id: 'new-123',
        status: 'open',
        created_at: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await caseService.createCase(newCase);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cases'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newCase)
        })
      );
    });

    it('should validate required fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Title is required' })
      });

      await expect(
        caseService.createCase({ title: '', priority: 'low' })
      ).rejects.toThrow();
    });
  });

  describe('updateCase', () => {
    it('should update an existing case', async () => {
      const caseId = '123';
      const updates = {
        status: 'closed' as const,
        resolution: 'Fraud confirmed'
      };

      const mockResponse = {
        id: caseId,
        title: 'Updated Case',
        ...updates,
        updated_at: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await caseService.updateCase(caseId, updates);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/cases/${caseId}`),
        expect.objectContaining({
          method: 'PUT'
        })
      );
    });

    it('should handle partial updates', async () => {
      const caseId = '123';
      const updates = { status: 'in_progress' as const };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: caseId, ...updates })
      });

      await caseService.updateCase(caseId, updates);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toEqual(updates);
    });
  });

  describe('deleteCase', () => {
    it('should delete a case', async () => {
      const caseId = '123';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Case deleted' })
      });

      await expect(caseService.deleteCase(caseId)).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/cases/${caseId}`),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    it('should handle delete of non-existent case', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(caseService.deleteCase('nonexistent')).rejects.toThrow();
    });
  });

  describe('addNote', () => {
    it('should add a note to a case', async () => {
      const caseId = '123';
      const note = {
        content: 'Investigation update',
        author: 'investigator@example.com'
      };

      const mockResponse = {
        id: 'note-1',
        ...note,
        case_id: caseId,
        created_at: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await caseService.addNote(caseId, note.content);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('assignCase', () => {
    it('should assign case to user', async () => {
      const caseId = '123';
      const userId = 'user-456';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: caseId,
          assigned_to: userId
        })
      });

      await caseService.assignCase(caseId, userId);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/cases/${caseId}/assign`),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  describe('getCaseStatistics', () => {
    it('should fetch case statistics', async () => {
      const mockStats = {
        total: 100,
        open: 30,
        in_progress: 45,
        closed: 25,
        by_priority: {
          high: 15,
          medium: 50,
          low: 35
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });

      const stats = await caseService.getCaseStatistics();

      expect(stats).toEqual(mockStats);
    });
  });

  describe('searchCases', () => {
    it('should search cases by query', async () => {
      const query = 'fraud';
      const mockResults = [
        { id: '1', title: 'Fraud Case 1', score: 0.9 },
        { id: '2', title: 'Fraud Case 2', score: 0.7 }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      const results = await caseService.searchCases(query);

      expect(results).toEqual(mockResults);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`search?q=${encodeURIComponent(query)}`),
        expect.any(Object)
      );
    });

    it('should handle empty search results', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const results = await caseService.searchCases('nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('bulkUpdateCases', () => {
    it('should update multiple cases at once', async () => {
      const caseIds = ['1', '2', '3'];
      const updates = { status: 'reviewed' as const };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          updated: caseIds.length,
          ids: caseIds
        })
      });

      const result = await caseService.bulkUpdateCases(caseIds, updates);

      expect(result.updated).toBe(3);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cases/bulk'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining(JSON.stringify(caseIds))
        })
      );
    });
  });

  describe('exportCases', () => {
    it('should export cases in specified format', async () => {
      const format = 'csv';
      const mockBlob = new Blob(['case data'], { type: 'text/csv' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });

      const blob = await caseService.exportCases(format);

      expect(blob).toEqual(mockBlob);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/cases/export?format=${format}`),
        expect.any(Object)
      );
    });
  });
});
