import { describe, it } from '@jest/globals';
import { formatCurrency, formatDate, formatPercentage } from '@/formatting';

describe('Formatting Utils', () => {
  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-500)).toBe('-$500.00');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toContain('1,000');
    });

    it('should handle edge cases', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(NaN)).toBe('$0.00');
    });
  });

  describe('formatDate', () => {
    it('should format ISO date strings', () => {
      const date = '2025-01-15T10:30:00Z';
      const formatted = formatDate(date);
      expect(formatted).toContain('2025');
      expect(formatted).toContain('Jan');
    });

    it('should handle Date objects', () => {
      const date = new Date('2025-01-15');
      const formatted = formatDate(date);
      expect(formatted).toBeTruthy();
    });

    it('should handle custom formats', () => {
      const date = '2025-01-15';
      expect(formatDate(date, 'short')).toBeTruthy();
      expect(formatDate(date, 'long')).toBeTruthy();
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
      expect(formatDate(null as any)).toBe('Invalid Date');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.5)).toBe('50%');
      expect(formatPercentage(0.123)).toBe('12.3%');
      expect(formatPercentage(1)).toBe('100%');
    });

    it('should handle decimal places', () => {
      expect(formatPercentage(0.12345, 2)).toBe('12.35%');
      expect(formatPercentage(0.12345, 0)).toBe('12%');
    });

    it('should handle edge cases', () => {
      expect(formatPercentage(0)).toBe('0%');
      expect(formatPercentage(1.5)).toBe('150%');
    });
  });
});
