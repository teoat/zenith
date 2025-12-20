/**
 * ErrorMessage Component
 * 
 * User-friendly error display component with categorization and suggestions
 */

import React from 'react';
import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

interface ErrorMessageProps {
  error?: {
    code?: string;
    category?: string;
    message: string;
    suggestion?: string;
    context?: Record<string, unknown>;
  } | string;
  onDismiss?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss, className = '' }) => {
  if (!error) return null;

  // Handle string errors
  const errorObj = typeof error === 'string' 
    ? { message: error, category: 'client_error' }
    : error;

  // Determine error styling based on category
  const getErrorStyle = () => {
    switch (errorObj.category) {
      case 'validation_error':
      case 'client_error':
        return {
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          textColor: 'text-amber-900 dark:text-amber-100',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600" />
        };
      case 'server_error':
      case 'authentication_error':
      case 'authorization_error':
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-900 dark:text-red-100',
          icon: <XCircle className="h-5 w-5 text-red-600" />
        };
      case 'not_found_error':
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-900 dark:text-blue-100',
          icon: <Info className="h-5 w-5 text-blue-600" />
        };
      default:
        return {
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-900 dark:text-gray-100',
          icon: <AlertCircle className="h-5 w-5 text-gray-600" />
        };
    }
  };

  const style = getErrorStyle();

  return (
    <div 
      className={`rounded-lg border ${style.borderColor} ${style.bgColor} p-4 ${className}`}
      role="alert"
      aria-live="assertive"
      data-testid="error-message"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {style.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${style.textColor}`}>
            {errorObj.message}
          </div>
          
          {errorObj.suggestion && (
            <div className={`mt-2 text-sm ${style.textColor} opacity-80`}>
              💡 {errorObj.suggestion}
            </div>
          )}
          
          {errorObj.code && (
            <div className="mt-2 text-xs opacity-60">
              Error code: {errorObj.code}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${style.textColor} opacity-60 hover:opacity-100 transition-opacity`}
            aria-label="Dismiss error"
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

// Toast-style error notification
export const ErrorToast: React.FC<ErrorMessageProps & { duration?: number }> = ({ 
  error, 
  onDismiss,
  duration = 5000 
}) => {
  React.useEffect(() => {
    if (duration && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top">
      <ErrorMessage error={error} onDismiss={onDismiss} />
    </div>
  );
};

// Inline form error
export const FormError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  
  return (
    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1" data-testid="form-error">
      <AlertCircle className="h-4 w-4" />
      {message}
    </p>
  );
};
