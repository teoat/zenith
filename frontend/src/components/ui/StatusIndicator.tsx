// components/ui/StatusIndicator.tsx
import React from "react";

interface StatusIndicatorProps {
  status: "online" | "offline" | "warning" | "error";
  label: string;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className = "",
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "#10b981";
      case "offline":
        return "#6b7280";
      case "warning":
        return "#f59e0b";
      case "error":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className={`status-indicator ${className}`}>
      <div
        className="status-dot"
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="status-label">{label}</span>
    </div>
  );
};

export default StatusIndicator;
