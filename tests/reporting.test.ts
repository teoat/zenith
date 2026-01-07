import { describe, it, jest, beforeEach } from '@jest/globals';
import { reportingService } from '@/reporting';

global.fetch = jest.fn();

describe('ReportingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('should generate case report', async () => {
      const mockReport = {
        id: 'report-1',
        type: 'case_summary',
        data: {
          caseId: 'case-123',
          title: 'Fraud Investigation',
          summary: 'Detailed summary...'
        },
        generatedAt: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport
      } as any);

      const result = await reportingService.generateReport('case-123', 'case_summary');

      expect(result).toEqual(mockReport);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reports/generate'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle generation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      } as any);

      await expect(
        reportingService.generateReport('case-123', 'case_summary')
      ).rejects.toThrow();
    });
  });

  describe('exportReport', () => {
    it('should export report to PDF', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      } as any);

      const result = await reportingService.exportReport('report-1', 'pdf');

      expect(result).toEqual(mockBlob);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reports/report-1/export'),
        expect.any(Object)
      );
    });

    it('should export to different formats', async () => {
      const mockBlob = new Blob(['CSV content'], { type: 'text/csv' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      } as any);

      await reportingService.exportReport('report-1', 'csv');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('format=csv'),
        expect.any(Object)
      );
    });
  });

  describe('scheduleReport', () => {
    it('should schedule recurring report', async () => {
      const mockSchedule = {
        id: 'schedule-1',
        reportType: 'daily_summary',
        frequency: 'daily',
        nextRun: '2025-01-16T00:00:00Z'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSchedule
      } as any);

      const result = await reportingService.scheduleReport({
        reportType: 'daily_summary',
        frequency: 'daily',
        time: '00:00'
      });

      expect(result).toEqual(mockSchedule);
    });
  });

  describe('getReportHistory', () => {
    it('should retrieve report history', async () => {
      const mockHistory = [
        { id: 'report-1', type: 'case_summary', generatedAt: '2025-01-01' },
        { id: 'report-2', type: 'compliance', generatedAt: '2025-01-02' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory
      } as any);

      const result = await reportingService.getReportHistory();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('report-1');
    });
  });
});
