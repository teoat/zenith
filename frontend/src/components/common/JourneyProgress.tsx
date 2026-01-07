/**
 * User Journey Progress Component
 *
 * Visual progress indicator showing user's position in the fraud investigation workflow.
 * Displays checkpoints from Login → Dashboard → Evidence → ... → Reporting
 */

import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  LogIn,
  LayoutDashboard,
  FileSearch,
  GitCompare,
  Scale,
  Briefcase,
  Network,
  BarChart3,
  FileText,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

interface JourneyCheckpoint {
  id: string;
  path: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  aiHint?: string;
}

const JOURNEY_CHECKPOINTS: JourneyCheckpoint[] = [
  {
    id: "01",
    path: "/login",
    label: "Login",
    shortLabel: "LOGIN",
    icon: <LogIn size={16} />,
  },
  {
    id: "02",
    path: "/",
    label: "Dashboard",
    shortLabel: "DASH",
    icon: <LayoutDashboard size={16} />,
    aiHint: "👮 Risk summary available",
  },
  {
    id: "03",
    path: "/evidence",
    label: "Evidence Lab",
    shortLabel: "EVID",
    icon: <FileSearch size={16} />,
    aiHint: "📊 Forgery check active",
  },
  {
    id: "04",
    path: "/reconciliation",
    label: "Reconciliation",
    shortLabel: "RECON",
    icon: <GitCompare size={16} />,
    aiHint: "🔍 Suggest matching pairs",
  },
  {
    id: "05",
    path: "/adjudication",
    label: "Adjudication",
    shortLabel: "ADJUD",
    icon: <Scale size={16} />,
    aiHint: "⚖️ Legal guidance ready",
  },
  {
    id: "06",
    path: "/cases",
    label: "Cases",
    shortLabel: "CASES",
    icon: <Briefcase size={16} />,
    aiHint: "👮 Next steps suggested",
  },
  {
    id: "07",
    path: "/investigation",
    label: "Investigation",
    shortLabel: "INVEST",
    icon: <Network size={16} />,
    aiHint: "🔍 Link analysis available",
  },
  {
    id: "08",
    path: "/visualization",
    label: "Analytics",
    shortLabel: "VIZ",
    icon: <BarChart3 size={16} />,
    aiHint: "📊 Trend insights",
  },
  {
    id: "09",
    path: "/reporting",
    label: "Reporting",
    shortLabel: "REPORT",
    icon: <FileText size={16} />,
    aiHint: "⚖️ Format check ready",
  },
];

interface JourneyProgressProps {
  /** Show compact version for narrow layouts */
  compact?: boolean;
  /** Show AI hints for each checkpoint */
  showHints?: boolean;
  /** Custom class name */
  className?: string;
}

export const JourneyProgress: React.FC<JourneyProgressProps> = ({
  compact = false,
  showHints = false,
  className = "",
}) => {
  const location = useLocation();

  // Find current checkpoint index
  const currentIndex = JOURNEY_CHECKPOINTS.findIndex(
    (cp) => cp.path === location.pathname,
  );

  const getCheckpointStatus = (
    index: number,
  ): "completed" | "current" | "upcoming" => {
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "current";
    return "upcoming";
  };

  const getStatusColor = (
    status: "completed" | "current" | "upcoming",
  ): string => {
    switch (status) {
      case "completed":
        return "text-emerald-500 bg-emerald-500/10";
      case "current":
        return "text-purple-500 bg-purple-500/20 ring-2 ring-purple-500";
      case "upcoming":
        return "text-slate-400 bg-slate-500/10";
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {JOURNEY_CHECKPOINTS.map((checkpoint, index) => {
          const status = getCheckpointStatus(index);
          return (
            <React.Fragment key={checkpoint.id}>
              <Link
                to={checkpoint.path}
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full
                  transition-all duration-200 hover:scale-110
                  ${getStatusColor(status)}
                `}
                title={checkpoint.label}
              >
                {status === "completed" ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <span className="text-xs font-bold">{checkpoint.id}</span>
                )}
              </Link>
              {index < JOURNEY_CHECKPOINTS.length - 1 && (
                <ChevronRight size={12} className="text-slate-600" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300">
          Fraud Investigation Journey
        </h3>
        <span className="text-xs text-slate-500">
          Step {currentIndex + 1} of {JOURNEY_CHECKPOINTS.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-700" />
        <div
          className="absolute top-3 left-0 h-0.5 bg-purple-500 transition-all duration-500"
          style={{
            width: `${(currentIndex / (JOURNEY_CHECKPOINTS.length - 1)) * 100}%`,
          }}
        />

        <div className="relative flex justify-between">
          {JOURNEY_CHECKPOINTS.map((checkpoint, index) => {
            const status = getCheckpointStatus(index);
            return (
              <Link
                key={checkpoint.id}
                to={checkpoint.path}
                className="flex flex-col items-center group"
              >
                {/* Checkpoint Circle */}
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    transition-all duration-200 group-hover:scale-110
                    ${getStatusColor(status)}
                  `}
                >
                  {status === "completed" ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    checkpoint.icon
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${status === "current" ? "text-purple-400" : "text-slate-500"}
                  `}
                >
                  {checkpoint.shortLabel}
                </span>

                {/* AI Hint */}
                {showHints && checkpoint.aiHint && status === "current" && (
                  <span className="mt-1 text-[10px] text-purple-400 animate-pulse">
                    {checkpoint.aiHint}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Current Stage Info */}
      {currentIndex >= 0 && (
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="flex items-center gap-2">
            <div className="text-purple-400">
              {JOURNEY_CHECKPOINTS[currentIndex].icon}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {JOURNEY_CHECKPOINTS[currentIndex].label}
              </p>
              {JOURNEY_CHECKPOINTS[currentIndex].aiHint && (
                <p className="text-xs text-slate-400">
                  {JOURNEY_CHECKPOINTS[currentIndex].aiHint}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyProgress;
