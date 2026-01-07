import React from "react";
import { CheckCircle } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "All Caught Up!",
  description = "There are no pending alerts in your queue. Great job!",
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-full mb-6">
        {icon || (
          <CheckCircle className="w-16 h-16 text-green-500 dark:text-green-400" />
        )}
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
        {description}
      </p>
      {action}
    </div>
  );
};

export default EmptyState;
