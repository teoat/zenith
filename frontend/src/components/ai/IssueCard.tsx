import React from "react";
import { AlertTriangle, Info, XCircle } from "lucide-react";

interface CodeIssue {
  file_path: string;
  line_number: number;
  column?: number;
  issue_type: string;
  category:
    | "security"
    | "performance"
    | "maintainability"
    | "reliability"
    | "compliance"
    | "best_practice";
  severity: "info" | "warning" | "error" | "critical";
  title: string;
  description: string;
  code_snippet: string;
  suggestion: string;
  confidence_score: number;
  cwe_id?: string;
  owasp_id?: string;
  references: string[];
}

interface IssueCardProps {
  issue: CodeIssue;
  onClick?: () => void;
}

const getSeverityIcon = (severity: CodeIssue["severity"]) => {
  switch (severity) {
    case "critical":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "error":
      return <XCircle className="w-5 h-5 text-red-400" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case "info":
      return <Info className="w-5 h-5 text-blue-500" />;
    default:
      return <Info className="w-5 h-5 text-gray-500" />;
  }
};

const getSeverityColor = (severity: CodeIssue["severity"]) => {
  switch (severity) {
    case "critical":
      return "border-red-200 bg-red-50";
    case "error":
      return "border-red-200 bg-red-50";
    case "warning":
      return "border-yellow-200 bg-yellow-50";
    case "info":
      return "border-blue-200 bg-blue-50";
    default:
      return "border-gray-200 bg-gray-50";
  }
};

const getCategoryColor = (category: CodeIssue["category"]) => {
  switch (category) {
    case "security":
      return "bg-red-100 text-red-800";
    case "performance":
      return "bg-yellow-100 text-yellow-800";
    case "maintainability":
      return "bg-blue-100 text-blue-800";
    case "reliability":
      return "bg-green-100 text-green-800";
    case "compliance":
      return "bg-purple-100 text-purple-800";
    case "best_practice":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick }) => {
  return (
    <div
      className={`border-l-4 p-4 rounded-r-lg cursor-pointer hover:shadow-md transition-shadow ${getSeverityColor(issue.severity)}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getSeverityIcon(issue.severity)}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900">{issue.title}</h4>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(issue.category)}`}
              >
                {issue.category}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>
                {issue.file_path}:{issue.line_number}
              </span>
              <span>
                Confidence: {Math.round(issue.confidence_score * 100)}%
              </span>
              {issue.cwe_id && <span>CWE-{issue.cwe_id}</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
              issue.severity === "critical"
                ? "bg-red-100 text-red-800"
                : issue.severity === "error"
                  ? "bg-red-100 text-red-800"
                  : issue.severity === "warning"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
            }`}
          >
            {issue.severity}
          </div>
        </div>
      </div>
    </div>
  );
};
