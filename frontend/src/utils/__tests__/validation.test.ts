import { describe, it } from '@jest/globals';
import { validateEmail, validatePassword, validatePhone, validateSSN } from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(validateEmail('valid_email@domain.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('no@domain')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
      expect(validateEmail('  test@example.com  ')).toBe(true); // with whitespace
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('MyP@ssw0rd')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('weak')).toBe(false); // too short
      expect(validatePassword('alllowercase')).toBe(false); // no uppercase
      expect(validatePassword('ALLUPPERCASE')).toBe(false); // no lowercase
      expect(validatePassword('NoNumbers!')).toBe(false); // no numbers
    });

    it('should enforce minimum length', () => {
      expect(validatePassword('Sh0rt!')).toBe(false);
      expect(validatePassword('LongEnough123!')).toBe(true);
    });
  });

  describe('validatePhone', () => {
    it('should validate US phone numbers', () => {
      expect(validatePhone('555-123-4567')).toBe(true);
      expect(validatePhone('(555) 123-4567')).toBe(true);
      expect(validatePhone('5551234567')).toBe(true);
      expect(validatePhone('+1-555-123-4567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc-def-ghij')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validateSSN', () => {
    it('should validate SSN formats', () => {
      expect(validateSSN('123-45-6789')).toBe(true);
      expect(validateSSN('123456789')).toBe(true);
    });

    it('should reject invalid SSNs', () => {
      expect(validateSSN('000-00-0000')).toBe(false);
      expect(validateSSN('123-45-67')).toBe(false);
      expect(validateSSN('abc-de-fghi')).toBe(false);
    });
  });
});
