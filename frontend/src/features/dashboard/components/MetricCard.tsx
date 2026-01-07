import React, { memo } from "react";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import MetricSparkline from "./MetricSparkline";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number; // Percentage change
  sparkData?: number[];
  icon: LucideIcon;
  iconColor?: string;
  isCritical?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = memo(
  ({
    title,
    value,
    change,
    sparkData,
    icon: Icon,
    iconColor = "text-blue-500",
    isCritical = false,
  }) => {
    const getTrendIcon = () => {
      if (!change) return <Minus size={14} className="text-slate-400" />;
      if (change > 0)
        return <TrendingUp size={14} className="text-green-500" />;
      return <TrendingDown size={14} className="text-red-500" />;
    };

    const getTrendColor = () => {
      if (!change) return "text-slate-400";
      if (change > 0) return "text-green-600";
      return "text-red-600";
    };

    return (
      <div
        className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${
          isCritical
            ? "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30"
            : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          <div
            className={`p-2 rounded-lg ${
              isCritical
                ? "bg-red-100 dark:bg-red-900/20"
                : "bg-slate-100 dark:bg-slate-800"
            }`}
          >
            <Icon className={iconColor} size={20} />
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}
            >
              {getTrendIcon()}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          {title}
        </p>

        {sparkData && sparkData.length > 0 && (
          <MetricSparkline
            data={sparkData}
            color={isCritical ? "#ef4444" : "#3b82f6"}
            height={32}
          />
        )}
      </div>
    );
  },
);

export default React.memo(MetricCard);
