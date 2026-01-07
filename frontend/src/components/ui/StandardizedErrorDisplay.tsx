import React from "react";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { AccessibleButton } from "./AccessibleButton";

export interface StandardizedError {
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  details?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
}

interface StandardizedErrorDisplayProps {
  error: StandardizedError;
  className?: string;
}

export const StandardizedErrorDisplay: React.FC<
  StandardizedErrorDisplayProps
> = ({ error, className = "" }) => {
  const errorId = React.useId();

  const getIcon = () => {
    switch (error.type) {
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" aria-hidden="true" />;
      case "warning":
        return (
          <AlertTriangle
            className="w-5 h-5 text-yellow-500"
            aria-hidden="true"
          />
        );
      case "info":
        return <Info className="w-5 h-5 text-blue-500" aria-hidden="true" />;
      case "success":
        return (
          <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
        );
      default:
        return <Info className="w-5 h-5 text-blue-500" aria-hidden="true" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "p-4 rounded-lg border flex items-start gap-3";

    switch (error.type) {
      case "error":
        return `${baseStyles} bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200`;
      case "warning":
        return `${baseStyles} bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200`;
      case "info":
        return `${baseStyles} bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200`;
      case "success":
        return `${baseStyles} bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200`;
      default:
        return `${baseStyles} bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200`;
    }
  };

  if (error.type === "error") {
    return (
      <div
        className={`${getStyles()} ${className}`}
        role="alert"
        aria-live="assertive"
        aria-label={`error: ${error.title}`}
      >
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm" id={errorId}>
            {error.title}
          </h3>
          <p className="text-sm mt-1 opacity-90">{error.message}</p>
          {error.details && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer hover:underline">
                Show details
              </summary>
              <p className="text-xs mt-1 opacity-75 whitespace-pre-wrap">
                {error.details}
              </p>
            </details>
          )}
          {error.action && (
            <div className="mt-3">
              <AccessibleButton
                onClick={error.action.onClick}
                size="sm"
                variant="ghost"
                className="text-xs"
                aria-describedby={errorId}
              >
                {error.action.label}
              </AccessibleButton>
            </div>
          )}
        </div>
        {error.dismissible && error.onDismiss && (
          <AccessibleButton
            onClick={error.onDismiss}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Dismiss error"
          >
            <XCircle className="w-4 h-4" aria-hidden="true" />
          </AccessibleButton>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${getStyles()} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`${error.type}: ${error.title}`}
    >
      {getIcon()}

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm" id={errorId}>
          {error.title}
        </h3>

        <p className="text-sm mt-1 opacity-90">{error.message}</p>

        {error.details && (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer hover:underline">
              Show details
            </summary>
            <p className="text-xs mt-1 opacity-75 whitespace-pre-wrap">
              {error.details}
            </p>
          </details>
        )}

        {error.action && (
          <div className="mt-3">
            <AccessibleButton
              onClick={error.action.onClick}
              size="sm"
              variant="ghost"
              className="text-xs"
              aria-describedby={errorId}
            >
              {error.action.label}
            </AccessibleButton>
          </div>
        )}
      </div>

      {error.dismissible && error.onDismiss && (
        <AccessibleButton
          onClick={error.onDismiss}
          variant="ghost"
          size="sm"
          className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label="Dismiss error"
        >
          <XCircle className="w-4 h-4" aria-hidden="true" />
        </AccessibleButton>
      )}
    </div>
  );
};

// Utility function to create standardized errors
export const createStandardizedError = (
  type: StandardizedError["type"],
  title: string,
  message: string,
  options?: {
    details?: string;
    action?: StandardizedError["action"];
    dismissible?: boolean;
    onDismiss?: () => void;
  },
): StandardizedError => ({
  type,
  title,
  message,
  details: options?.details,
  action: options?.action,
  dismissible: options?.dismissible ?? true,
  onDismiss: options?.onDismiss,
});

// Predefined error creators
export const createNetworkError = (
  action: string,
  details?: string,
  onRetry?: () => void,
) =>
  createStandardizedError(
    "error",
    "Network Error",
    `Failed to ${action}. Please check your connection and try again.`,
    {
      details,
      action: onRetry
        ? {
            label: "Retry",
            onClick: onRetry,
          }
        : {
            label: "Reload Page",
            onClick: () => window.location.reload(),
          },
    },
  );

export const createValidationError = (field: string, message: string) =>
  createStandardizedError(
    "warning",
    "Validation Error",
    `Please correct the following issue: ${message}`,
    {
      details: `Field: ${field}`,
      dismissible: false,
    },
  );

export const createSuccessMessage = (action: string) =>
  createStandardizedError(
    "success",
    "Success",
    `${action} completed successfully.`,
    { dismissible: true },
  );
