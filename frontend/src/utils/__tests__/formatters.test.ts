import { 
  formatFileSize, 
  formatNumber, 
  formatCurrency, 
  formatPercentage, 
  formatDate, 
  formatRelativeTime, 
  truncateString, 
  formatDuration, 
  formatTime 
} from '@/formatters';

describe('formatters', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.50 MB');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with locale', () => {
      expect(formatNumber(1000)).toBe('1,000');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(0.75)).toBe('75.0%');
      expect(formatPercentage(0.1234, 2)).toBe('12.34%');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      expect(formatDate(date)).toBe('Jan 1, 2023');
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format relative time correctly', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo)).toBe('1h ago');
    });
  });

  describe('truncateString', () => {
    it('should truncate strings correctly', () => {
      expect(truncateString('Hello World', 8)).toBe('Hello...');
      expect(truncateString('Short', 10)).toBe('Short');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3665)).toBe('1:01:05');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2023-01-01T13:00:00');
      // result depends on locale but we can check if it contains AM/PM or 24h
      const formatted = formatTime(date);
      expect(formatted).toMatch(/(AM|PM)/);
    });
  });
});
