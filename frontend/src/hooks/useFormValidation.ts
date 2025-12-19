import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  message?: string;
}

interface FieldConfig {
  [key: string]: ValidationRule;
}



interface UseFormValidationReturn {
  errors: Record<string, string>;
  validate: (data: Record<string, any>) => boolean;
  validateField: (field: string, value: any) => string | null;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  isValid: boolean;
}

/**
 * Custom hook for comprehensive form validation
 * Provides field-level and form-level validation with customizable rules
 */
export const useFormValidation = (config: FieldConfig): UseFormValidationReturn => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: string, value: any): string | null => {
    const rules = config[field];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      return rules.message || `${field} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    const stringValue = value.toString();

    // Min length validation
    if (rules.minLength && stringValue.length < rules.minLength) {
      return rules.message || `${field} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return rules.message || `${field} must be no more than ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return rules.message || `${field} format is invalid`;
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(stringValue);
      if (customError) {
        return customError;
      }
    }

    return null;
  }, [config]);

  const validate = useCallback((data: Record<string, any>): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(config).forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [config, validateField]);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    validate,
    validateField,
    clearError,
    clearAllErrors,
    isValid
  };
};

// Common validation configurations
export const validationConfigs = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 8,
    message: 'Password must be at least 8 characters'
  },
  confirmPassword: {
    required: true,
    custom: (value: string, formData?: any) => {
      if (formData?.password !== value) {
        return 'Passwords do not match';
      }
      return null;
    }
  },
  caseTitle: {
    required: true,
    minLength: 3,
    maxLength: 100,
    message: 'Case title must be between 3-100 characters'
  },
  caseDescription: {
    maxLength: 1000,
    message: 'Description cannot exceed 1000 characters'
  },
  fileName: {
    required: true,
    pattern: /^[a-zA-Z0-9._-]+$/,
    message: 'Filename can only contain letters, numbers, dots, underscores, and hyphens'
  }
};