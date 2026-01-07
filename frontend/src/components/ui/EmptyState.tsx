import React from "react";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4",
        className,
      )}
    >
      <Card className="w-full max-w-md border-dashed border-2 border-gray-200 dark:border-gray-700">
        <CardContent className="flex flex-col items-center py-8 text-center">
          {icon && <div className="mb-4 text-gray-400">{icon}</div>}

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>

          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
              {description}
            </p>
          )}

          <div className="flex gap-3">
            {action && <Button onClick={action.onClick}>{action.label}</Button>}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyState;
