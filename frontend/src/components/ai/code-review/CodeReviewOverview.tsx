import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, AlertTriangle, Shield, Zap, Settings, Target, CheckCircle, TrendingUp, FileText } from 'lucide-react';
import type { CodeReviewResult } from '@/types/code-review';

interface CodeReviewOverviewProps {
  reviewResult: CodeReviewResult;
}

export const CodeReviewOverview: React.FC<CodeReviewOverviewProps> = ({ reviewResult }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'maintainability': return <Settings className="w-4 h-4" />;
      case 'reliability': return <Target className="w-4 h-4" />;
      case 'compliance': return <CheckCircle className="w-4 h-4" />;
      case 'best_practice': return <TrendingUp className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      {/* Repository Info */}
      <div className="repo-info-card">
        <div className="repo-header">
          <GitBranch className="w-5 h-5 text-slate-500" />
          <span className="repo-name">{reviewResult.repository}</span>
          <span className="repo-branch">{reviewResult.branch}</span>
        </div>
        <div className="repo-details">
          <div className="detail-item">
            <span className="detail-label">Commit:</span>
            <code className="detail-value">{reviewResult.commit_hash}</code>
          </div>
          <div className="detail-item">
            <span className="detail-label">Analyzed:</span>
            <span className="detail-value">{reviewResult.generated_at}</span>
          </div>
        </div>
      </div>

      {/* Issues by Category */}
      <div className="category-breakdown">
        <h3 className="section-title">Issues by Category</h3>
        <div className="category-grid">
          {Object.entries(reviewResult.metrics.issues_by_category).map(([category, count]) => (
            <div key={category} className="category-item">
              <div className="category-icon">
                {getCategoryIcon(category)}
              </div>
              <div className="category-info">
                <div className="category-name">{category.replace('_', ' ').toUpperCase()}</div>
                <div className="category-count">{count} issues</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Issues */}
      <div className="recent-issues">
        <h3 className="section-title">Recent Critical Issues</h3>
        <div className="issues-list">
          {reviewResult.issues.slice(0, 5).map((issue, index) => (
            <div key={index} className="issue-item">
              <div className="issue-icon">
                <AlertTriangle className={`w-4 h-4 ${
                  issue.severity === 'critical' ? 'text-red-500' :
                  issue.severity === 'error' ? 'text-orange-500' :
                  issue.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
              </div>
              <div className="issue-content">
                <div className="issue-title">{issue.title}</div>
                <div className="issue-meta">
                  {issue.file_path}:{issue.line_number} • {issue.category} • {issue.severity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
