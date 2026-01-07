import React from "react";
import { Loader2, FileText, Database, Users } from "lucide-react";

interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "dots" | "pulse" | "shimmer";
  text?: string;
  rows?: number;
  context?: "page" | "component" | "data" | "network";
  size?: "sm" | "md" | "lg";
}

const LoadingState: React.FC<LoadingStateProps> = ({
  type = "spinner",
  text,
  rows = 3,
  context = "component",
  size = "md",
}) => {
  // Context-aware loading messages
  const getContextText = () => {
    if (text) return text;
    switch (context) {
      case "page":
        return "Loading page...";
      case "data":
        return "Fetching data...";
      case "network":
        return "Connecting...";
      default:
        return "Loading...";
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: { spinner: "w-6 h-6", icon: 16, text: "text-xs" },
    md: { spinner: "w-12 h-12", icon: 24, text: "text-sm" },
    lg: { spinner: "w-16 h-16", icon: 32, text: "text-base" },
  };

  const config = sizeConfig[size];

  if (type === "skeleton") {
    return (
      <div className="animate-pulse space-y-4" role="status" aria-live="polite">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse"></div>
          </div>
        ))}
        <span className="sr-only">{getContextText()}</span>
      </div>
    );
  }

  if (type === "shimmer") {
    return (
      <div
        className="relative overflow-hidden bg-slate-200 dark:bg-slate-700 rounded"
        role="status"
        aria-live="polite"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <div
              className={`${config.spinner} border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4`}
              aria-hidden="true"
            ></div>
            <p className={`${config.text} text-slate-600 dark:text-slate-400`}>
              {getContextText()}
            </p>
          </div>
        </div>
        <span className="sr-only">{getContextText()}</span>
      </div>
    );
  }

  if (type === "pulse") {
    const Icon =
      context === "data" ? Database : context === "network" ? Users : FileText;
    return (
      <div
        className="flex flex-col items-center justify-center py-8 animate-pulse"
        role="status"
        aria-live="polite"
      >
        <div className="relative">
          <Icon
            className={`text-blue-500 animate-pulse`}
            size={config.icon}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
        </div>
        {getContextText() && (
          <p
            className={`mt-4 ${config.text} text-slate-600 dark:text-slate-400 animate-pulse`}
          >
            {getContextText()}
          </p>
        )}
        <span className="sr-only">{getContextText()}</span>
      </div>
    );
  }

  if (type === "dots") {
    return (
      <div
        className="flex flex-col items-center justify-center py-8"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-center space-x-2">
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
            aria-hidden="true"
          ></div>
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
            aria-hidden="true"
          ></div>
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
            aria-hidden="true"
          ></div>
        </div>
        {getContextText() && (
          <p
            className={`mt-4 ${config.text} text-slate-600 dark:text-slate-400`}
          >
            {getContextText()}
          </p>
        )}
        <span className="sr-only">{getContextText()}</span>
      </div>
    );
  }

  // Default spinner with enhanced styling
  return (
    <div
      className="flex flex-col items-center justify-center py-8"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <Loader2
          className={`${config.spinner} text-blue-500 animate-spin`}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse"></div>
      </div>
      {getContextText() && (
        <p className={`mt-4 ${config.text} text-slate-600 dark:text-slate-400`}>
          {getContextText()}
        </p>
      )}
      <span className="sr-only">{getContextText()}</span>
    </div>
  );
};

export default LoadingState;
