// components/ui/ProgressBar.tsx
import React from "react";

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
  color?: "primary" | "success" | "warning" | "error";
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  className = "",
  color = "primary",
}) => {
  const getColorClass = () => {
    switch (color) {
      case "success":
        return "progress-success";
      case "warning":
        return "progress-warning";
      case "error":
        return "progress-error";
      default:
        return "progress-primary";
    }
  };

  return (
    <div className={`progress-container ${className}`}>
      {(label || showPercentage) && (
        <div className="progress-header">
          {label && <span className="progress-label">{label}</span>}
          {showPercentage && (
            <span className="progress-percentage">{Math.round(progress)}%</span>
          )}
        </div>
      )}

      <div className="progress-bar">
        <div
          className={`progress-fill ${getColorClass()}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
