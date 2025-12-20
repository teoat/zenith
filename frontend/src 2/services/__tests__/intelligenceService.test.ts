/**
 * Unit tests for Intelligence Service
 */

import { intelligenceService } from '../intelligenceService';

// Mock fetch
global.fetch = jest.fn();

describe('IntelligenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('analyzeFraud', () => {
    it('successfully analyzes fraud', async () => {
      const mockAlerts = [
        {
          alert_id: 'alert1',
          fraud_type: 'structuring',
          risk_score: 85,
          confidence: 0.9,
          transactions: ['tx1', 'tx2'],
          description: 'Test alert',
          detected_at: new Date().toISOString(),
          details: {}
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlerts
      });

      const transactions = [
        {
          id: 'tx1',
          amount: 9900,
          timestamp: new Date().toISOString(),
          source_account: 'ACC001',
          destination_account: 'ACC002',
          description: 'Test'
        }
      ];

      const result = await intelligenceService.analyzeFraud(transactions);

      expect(result).toEqual(mockAlerts);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/intelligence/fraud/analyze',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('handles API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      await expect(
        intelligenceService.analyzeFraud([])
      ).rejects.toThrow('Fraud analysis failed');
    });
  });

  describe('processEvidence', () => {
    it('successfully processes evidence file', async () => {
      const mockResult = {
        file_id: 'file1',
        filename: 'test.pdf',
        file_type: 'pdf',
        file_size: 1024,
        extracted_text: 'Test content',
        ocr_confidence: 0.95,
        metadata: {},
        processed_at: new Date().toISOString(),
        has_suspicious_indicators: false
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      });

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = await intelligenceService.processEvidence(file);

      expect(result).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('searchEvidence', () => {
    it('successfully searches evidence', async () => {
      const mockResults = [
        {
          file_id: 'file1',
          filename: 'doc1.pdf',
          file_type: 'pdf',
          snippet: 'Test snippet...',
          ocr_confidence: 0.9,
          processed_at: new Date().toISOString()
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      });

      const results = await intelligenceService.searchEvidence('test query');

      expect(results).toEqual(mockResults);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/intelligence/evidence/search?query='),
        expect.any(Object)
      );
    });
  });
});
