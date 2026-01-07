import React from "react";
import {
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";

interface CodeReviewMetrics {
  total_issues: number;
  security_issues: number;
  performance_issues: number;
  maintainability_issues: number;
  reliability_issues: number;
  compliance_issues: number;
  best_practice_issues: number;
  total_lines: number;
  lines_per_issue: number;
  analysis_time_seconds: number;
}

interface CodeReviewIssue {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  file: string;
  line: number;
  description: string;
  suggestion?: string;
}

interface CodeReviewResult {
  repository: string;
  branch: string;
  commit_hash: string;
  files_analyzed: number;
  total_lines: number;
  quality_score: number;
  quality_rating: "excellent" | "good" | "fair" | "poor" | "critical";
  issues: CodeReviewIssue[];
  metrics: CodeReviewMetrics;
}

interface MetricsSummaryProps {
  reviewResult: CodeReviewResult;
}

const getRatingColor = (rating: CodeReviewResult["quality_rating"]) => {
  switch (rating) {
    case "excellent":
      return "text-green-600 bg-green-100";
    case "good":
      return "text-blue-600 bg-blue-100";
    case "fair":
      return "text-yellow-600 bg-yellow-100";
    case "poor":
      return "text-orange-600 bg-orange-100";
    case "critical":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({
  reviewResult,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Quality Overview
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(reviewResult.quality_rating)}`}
        >
          {reviewResult.quality_rating.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {reviewResult.quality_score.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">Quality Score</div>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-blue-500" />
          <div>
            <div className="font-semibold">{reviewResult.files_analyzed}</div>
            <div className="text-sm text-gray-500">Files Analyzed</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <div>
            <div className="font-semibold">
              {reviewResult.metrics.total_issues}
            </div>
            <div className="text-sm text-gray-500">Issues Found</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-green-500" />
          <div>
            <div className="font-semibold">
              {reviewResult.metrics.analysis_time_seconds.toFixed(1)}s
            </div>
            <div className="text-sm text-gray-500">Analysis Time</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-red-500" />
          <div>
            <div className="font-semibold">
              {reviewResult.metrics.security_issues}
            </div>
            <div className="text-xs text-gray-500">Security Issues</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <div>
            <div className="font-semibold">
              {reviewResult.metrics.performance_issues}
            </div>
            <div className="text-xs text-gray-500">Performance Issues</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <div>
            <div className="font-semibold">
              {reviewResult.metrics.maintainability_issues}
            </div>
            <div className="text-xs text-gray-500">Maintainability Issues</div>
          </div>
        </div>
      </div>
    </div>
  );
};
