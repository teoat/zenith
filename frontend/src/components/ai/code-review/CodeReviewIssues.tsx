import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import type { CodeReviewResult } from "@/types/code-review";

interface CodeReviewIssuesProps {
  reviewResult: CodeReviewResult;
}

export const CodeReviewIssues: React.FC<CodeReviewIssuesProps> = ({
  reviewResult,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredIssues = reviewResult.issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.file_path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity =
      severityFilter === "all" || issue.severity === severityFilter;
    const matchesCategory =
      categoryFilter === "all" || issue.category === categoryFilter;
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "error":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      {/* Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="maintainability">Maintainability</option>
            <option value="reliability">Reliability</option>
            <option value="compliance">Compliance</option>
            <option value="best_practice">Best Practice</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      <div className="issues-container">
        {filteredIssues.map((issue, index) => (
          <div key={index} className="issue-card">
            <div className="issue-header">
              <div className="issue-title-section">
                <h4 className="issue-title">{issue.title}</h4>
                <div className="issue-meta">
                  <code className="issue-file">
                    {issue.file_path}:{issue.line_number}
                  </code>
                  <span className="issue-category">{issue.category}</span>
                </div>
              </div>
              <div className="issue-severity">
                <span
                  className={`severity-badge ${getSeverityColor(issue.severity)}`}
                >
                  {issue.severity.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="issue-description">
              <p>{issue.description}</p>
            </div>

            <div className="issue-code-snippet">
              <pre className="code-block">
                <code>{issue.code_snippet}</code>
              </pre>
            </div>

            <div className="issue-suggestion">
              <h5 className="suggestion-title">Suggestion:</h5>
              <p className="suggestion-text">{issue.suggestion}</p>
            </div>

            {(issue.cwe_id || issue.owasp_id) && (
              <div className="issue-references">
                <h5 className="references-title">References:</h5>
                <div className="references-list">
                  {issue.cwe_id && (
                    <span className="reference-tag">CWE-{issue.cwe_id}</span>
                  )}
                  {issue.owasp_id && (
                    <span className="reference-tag">{issue.owasp_id}</span>
                  )}
                </div>
              </div>
            )}

            <div className="issue-confidence">
              <span className="confidence-label">Confidence:</span>
              <span className="confidence-value">
                {(issue.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
