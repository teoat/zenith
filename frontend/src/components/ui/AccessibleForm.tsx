// frontend/src/components/ui/AccessibleForm.tsx
import React, { useState, useRef, useMemo } from 'react';
import { AccessibleButton } from './AccessibleButton';
import { accessibilityManager } from '../../lib/accessibility';
import { secureLogger } from '../../utils/secureLogger';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string }>; // For select
  validation?: {
    required?: string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    custom?: (value: string) => string | null;
  };
}

interface AccessibleFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => void | Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
}

export function AccessibleForm({
  fields,
  onSubmit,
  submitLabel = 'Submit',
  loading = false,
  className = ''
}: AccessibleFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize form values using useMemo
  const initialValues = useMemo(() => {
    const values: Record<string, string> = {};
    fields.forEach(field => {
      values[field.name] = '';
    });
    return values;
  }, [fields]);

  // Initialize state with computed values
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string): string | null => {
    const field = fields.find(f => f.name === name);
    if (!field?.validation) return null;

    const validation = field.validation;

    // Required validation
    if (validation.required && !value.trim()) {
      return validation.required;
    }

    // Skip other validations if field is empty and not required
    if (!value.trim() && !validation.required) {
      return null;
    }

    // Min length validation
    if (validation.minLength && value.length < validation.minLength.value) {
      return validation.minLength.message;
    }

    // Max length validation
    if (validation.maxLength && value.length > validation.maxLength.value) {
      return validation.maxLength.message;
    }

    // Pattern validation
    if (validation.pattern && !validation.pattern.value.test(value)) {
      return validation.pattern.message;
    }

    // Custom validation
    if (validation.custom) {
      return validation.custom(value);
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field.name, values[field.name] || '');
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    const error = validateField(name, values[name] || '');
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    fields.forEach(field => {
      allTouched[field.name] = true;
    });
    setTouched(allTouched);

    // Validate form
    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = formRef.current?.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
        if (element) {
          element.focus();
          accessibilityManager.announce(`Error: ${errors[firstErrorField]}`, 'assertive');
        }
      }
      return;
    }

    try {
      await onSubmit(values);
      accessibilityManager.announce('Form submitted successfully', 'polite');
     } catch (error) { 
      accessibilityManager.announce('Form submission failed', 'assertive');
      secureLogger.error('Form submission error:', error);
    }
  };

  const renderField = (field: FormField) => {
    const fieldId = `field-${field.name}`;
    const errorId = `error-${field.name}`;
    const helpId = `help-${field.name}`;

    const hasError = errors[field.name];
    const isTouched = touched[field.name];
    const describedBy = [
      hasError ? errorId : null,
      field.helpText ? helpId : null
    ].filter(Boolean).join(' ') || undefined;

    const commonProps = {
      id: fieldId,
      name: field.name,
      value: values[field.name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        handleChange(field.name, e.target.value),
      onBlur: () => handleBlur(field.name),
      'aria-describedby': describedBy,
      className: `mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm ${
        hasError ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
      }`
    };

    return (
      <div key={field.name} className="mb-4">
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {field.label}
          {field.required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>

        <div className="mt-1">
          {field.type === 'textarea' ? (
            <textarea
              {...commonProps}
              rows={4}
              placeholder={field.placeholder}
              aria-invalid={hasError ? true : false}
              aria-required={field.required ? true : false}
            />
          ) : field.type === 'select' ? (
            <select
              {...commonProps}
              aria-invalid={hasError ? true : false}
              aria-required={field.required ? true : false}
            >
              <option value="">Select an option</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              {...commonProps}
              type={field.type}
              placeholder={field.placeholder}
              aria-invalid={hasError ? true : false}
              aria-required={field.required ? true : false}
            />
          )}
        </div>

        {field.helpText && (
          <p id={helpId} className="mt-1 text-sm text-gray-500">
            {field.helpText}
          </p>
        )}

        {hasError && isTouched && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {hasError}
          </p>
        )}
      </div>
    );
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      noValidate
    >
      {fields.map(renderField)}

      <div className="flex justify-end">
        <AccessibleButton
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading}
        >
          {submitLabel}
        </AccessibleButton>
      </div>
    </form>
  );
}