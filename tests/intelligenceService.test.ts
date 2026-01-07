/**
 * Unit tests for Intelligence Service
 */

import { intelligenceService } from '@/intelligenceService';
import { request } from '@/client';

// Mock the request function
jest.mock('../client', () => ({
  request: jest.fn(),
}));

describe('IntelligenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');
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

      (request as jest.Mock).mockResolvedValueOnce(mockAlerts);

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
      expect(request).toHaveBeenCalledWith(
        '/intelligence/fraud/analyze',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ transactions })
        })
      );
    });

    it('handles API errors', async () => {
      (request as jest.Mock).mockRejectedValueOnce(new Error('Bad Request'));

      await expect(
        intelligenceService.analyzeFraud([])
      ).rejects.toThrow('Bad Request');
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

      (request as jest.Mock).mockResolvedValueOnce(mockResult);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const result = await intelligenceService.processEvidence(file);

      expect(result).toEqual(mockResult);
      expect(request).toHaveBeenCalledWith('/intelligence/evidence/process', expect.any(Object));
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

      (request as jest.Mock).mockResolvedValueOnce(mockResults);

      const results = await intelligenceService.searchEvidence('test query');

      expect(results).toEqual(mockResults);
      expect(request).toHaveBeenCalledWith('/intelligence/evidence/search?query=test%20query');
    });
  });
});
