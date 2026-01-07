import React from "react";
import { CheckCircle, Circle, Clock, AlertTriangle } from "lucide-react";

interface CaseProgressBarProps {
  progress?: number;
  caseId?: string;
  showDetails?: boolean;
  className?: string;
}

interface ProgressStage {
  id: string;
  label: string;
  status: "completed" | "current" | "pending" | "warning";
  description?: string;
}

const CaseProgressBar: React.FC<CaseProgressBarProps> = ({
  progress = 40,
  caseId,
  showDetails = false,
  className = "",
}) => {
  // Mock progress stages - in real app, this would come from API
  const stages: ProgressStage[] = [
    {
      id: "intake",
      label: "Case Intake",
      status: progress >= 10 ? "completed" : "current",
      description: "Initial case information collected",
    },
    {
      id: "evidence",
      label: "Evidence Collection",
      status:
        progress >= 30 ? "completed" : progress >= 10 ? "current" : "pending",
      description: "Documents and data gathered",
    },
    {
      id: "analysis",
      label: "Initial Analysis",
      status:
        progress >= 60 ? "completed" : progress >= 30 ? "current" : "pending",
      description: "Pattern recognition and anomaly detection",
    },
    {
      id: "investigation",
      label: "Deep Investigation",
      status:
        progress >= 80 ? "completed" : progress >= 60 ? "current" : "pending",
      description: "Detailed forensic examination",
    },
    {
      id: "closure",
      label: "Case Closure",
      status:
        progress >= 100 ? "completed" : progress >= 80 ? "current" : "pending",
      description: "Final report and recommendations",
    },
  ];

  const getStatusIcon = (status: ProgressStage["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-500" size={16} />;
      case "current":
        return <Clock className="text-blue-500" size={16} />;
      case "warning":
        return <AlertTriangle className="text-yellow-500" size={16} />;
      default:
        return <Circle className="text-slate-400" size={16} />;
    }
  };

  const getStatusColor = (status: ProgressStage["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "current":
        return "bg-blue-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-slate-300 dark:bg-slate-600";
    }
  };

  const currentStage =
    stages.find((stage) => stage.status === "current") || stages[0];

  return (
    <div className={`case-progress-bar ${className}`}>
      {showDetails ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Case Progress
            </h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {progress}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {caseId && `Case ${caseId}`}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Case Opened</span>
              <span>Case Closed</span>
            </div>
          </div>

          {/* Progress Stages */}
          <div className="space-y-3">
            {stages.map((stage) => (
              <div key={stage.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(stage.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        stage.status === "completed"
                          ? "text-green-700 dark:text-green-400"
                          : stage.status === "current"
                            ? "text-blue-700 dark:text-blue-400"
                            : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {stage.label}
                    </span>
                    {stage.status === "current" && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                        In Progress
                      </span>
                    )}
                  </div>
                  {stage.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {stage.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Current Stage Details */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Current Focus: {currentStage.label}
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {currentStage.description}
            </p>
          </div>
        </div>
      ) : (
        // Simple progress bar view
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Case Progress
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(currentStage.status)}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseProgressBar;
