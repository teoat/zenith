import { describe, it, jest, beforeEach } from '@jest/globals';
import { aiService } from '../ai';

global.fetch = jest.fn();

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateInsights', () => {
    it('should generate AI insights for case', async () => {
      const mockInsights = {
        summary: 'Fraud pattern detected',
        confidence: 0.92,
        recommendations: ['Review transaction history', 'Contact customer'],
        entities: ['John Doe', '$5000']
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockInsights
      });

      const result = await aiService.generateInsights('case-123');
      expect(result).toEqual(mockInsights);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle AI service errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503
      });

      await expect(aiService.generateInsights('case-123')).rejects.toThrow();
    });
  });

  describe('predictFraudRisk', () => {
    it('should predict fraud risk score', async () => {
      const mockPrediction = {
        riskScore: 0.85,
        factors: ['unusual_transaction_amount', 'new_account'],
        threshold: 0.7
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPrediction
      });

      const result = await aiService.predictFraudRisk({ amount: 5000, customerId: '123' });
      expect(result.riskScore).toBe(0.85);
      expect(result.factors).toHaveLength(2);
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment of text', async () => {
      const mockSentiment = {
        score: 0.3,
        magnitude: 0.7,
        label: 'negative'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSentiment
      });

      const result = await aiService.analyzeSentiment('This is suspicious activity');
      expect(result.label).toBe('negative');
    });
  });

  describe('extractEntities', () => {
    it('should extract named entities from text', async () => {
      const mockEntities = {
        persons: ['John Doe', 'Jane Smith'],
        organizations: ['Acme Corp'],
        amounts: ['$5000', '$3000'],
        dates: ['2025-01-01']
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntities
      });

      const result = await aiService.extractEntities('John Doe transferred $5000 to Jane Smith');
      expect(result.persons).toContain('John Doe');
      expect(result.amounts).toContain('$5000');
    });
  });

  describe('suggestActions', () => {
    it('should suggest next actions based on case', async () => {
      const mockSuggestions = [
        { action: 'escalate', confidence: 0.9, reason: 'High risk detected' },
        { action: 'investigate', confidence: 0.7, reason: 'Pattern match' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuggestions
      });

      const result = await aiService.suggestActions('case-123');
      expect(result).toHaveLength(2);
      expect(result[0].action).toBe('escalate');
    });
  });
});
