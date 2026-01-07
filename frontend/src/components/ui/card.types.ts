/**
 * Card Component Types
 * Centralized type definitions to prevent import errors
 */

import * as React from "react";

export type VariantProps = {
  variant?: "default" | "secondary" | "destructive" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}
