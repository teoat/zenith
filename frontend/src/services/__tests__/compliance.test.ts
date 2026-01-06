import { describe, it, jest, beforeEach } from '@jest/globals';
import { complianceService } from '../compliance';

global.fetch = jest.fn();

describe('ComplianceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkCompliance', () => {
    it('should check compliance status', async () => {
      const mockStatus = {
        compliant: true,
        checks: [
          { rule: 'KYC', passed: true },
          { rule: 'AML', passed: true }
        ],
        score: 100
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      });

      const result = await complianceService.checkCompliance('case-123');
      expect(result.compliant).toBe(true);
      expect(result.score).toBe(100);
    });
  });

  describe('generateSAR', () => {
    it('should generate SAR report', async () => {
      const mockSAR = {
        id: 'sar-123',
        status: 'draft',
        data: { suspiciousActivity: 'Large cash transaction' }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSAR
      });

      const result = await complianceService.generateSAR({ caseId: 'case-123' });
      expect(result.id).toBe('sar-123');
      expect(result.status).toBe('draft');
    });
  });

  describe('submitRegulatory', () => {
    it('should submit regulatory report', async () => {
      const mockResponse = {
        submitted: true,
        confirmationNumber: 'REG-456',
        timestamp: new Date().toISOString()
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await complianceService.submitRegulatory('sar-123');
      expect(result.submitted).toBe(true);
      expect(result.confirmationNumber).toBeTruthy();
    });
  });
});
