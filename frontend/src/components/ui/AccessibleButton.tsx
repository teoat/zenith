// frontend/src/components/ui/AccessibleButton.tsx
import React, { useRef, useEffect } from "react";
import { useAccessibility } from "@/lib/accessibility";

interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  "aria-describedby"?: string;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
}

export function AccessibleButton({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText = "Loading...",
  disabled,
  children,
  className = "",
  type = "button",
  "aria-describedby": ariaDescribedBy,
  "aria-expanded": ariaExpanded,
  "aria-haspopup": ariaHaspopup,
  ...props
}: AccessibleButtonProps) {
  const { announce } = useAccessibility();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Announce loading state changes
  useEffect(() => {
    if (loading && buttonRef.current) {
      announce(loadingText, "polite");
    }
  }, [loading, loadingText, announce]);

  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",
    success:
      "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      ref={buttonRef}
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      aria-disabled={disabled || loading ? true : undefined}
      aria-describedby={ariaDescribedBy || undefined}
      aria-expanded={ariaExpanded !== undefined ? ariaExpanded : undefined}
      aria-haspopup={ariaHaspopup !== undefined ? ariaHaspopup : undefined}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {loading ? loadingText : children}
    </button>
  );
}
