/**
 * Card Component Types
 * Centralized type definitions to prevent import errors
 */

export type VariantProps = {
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
};

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export type CardHeaderProps = {
  children: React.ReactNode;
  className?: string;
};