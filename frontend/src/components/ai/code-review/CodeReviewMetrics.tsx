import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, FileText, CheckCircle } from 'lucide-react';
import type { CodeReviewResult } from '@/types/code-review';

interface CodeReviewMetricsProps {
  reviewResult: CodeReviewResult;
}

export const CodeReviewMetrics: React.FC<CodeReviewMetricsProps> = ({ reviewResult }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="metrics-dashboard">
        <h3 className="section-title">Code Quality Metrics</h3>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <h4>Maintainability Index</h4>
            </div>
            <div className="metric-value-large">
              {reviewResult.metrics.maintainability_index.toFixed(1)}
            </div>
            <div className="metric-description">
              Higher is better (0-100 scale)
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <Target className="w-6 h-6 text-green-500" />
              <h4>Issues per 1000 Lines</h4>
            </div>
            <div className="metric-value-large">
              {reviewResult.metrics.issues_per_1000_lines.toFixed(2)}
            </div>
            <div className="metric-description">
              Lower is better
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <FileText className="w-6 h-6 text-purple-500" />
              <h4>Avg Issues per File</h4>
            </div>
            <div className="metric-value-large">
              {reviewResult.metrics.avg_issues_per_file.toFixed(2)}
            </div>
            <div className="metric-description">
              Lower is better
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <CheckCircle className="w-6 h-6 text-orange-500" />
              <h4>Test Coverage</h4>
            </div>
            <div className="metric-value-large">
              {reviewResult.metrics.test_coverage_estimate}%
            </div>
            <div className="metric-description">
              Estimated coverage
            </div>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="severity-chart">
          <h4 className="chart-title">Issues by Severity</h4>
          <div className="severity-bars">
            {Object.entries(reviewResult.metrics.issues_by_severity).map(([severity, count]) => (
              <div key={severity} className="severity-bar">
                <div className="bar-label">{severity}</div>
                <div className="bar-container">
                  <div
                    className={`bar-fill severity-${severity}`}
                    style={{ width: `${(count / reviewResult.metrics.total_issues) * 100}%` }}
                  ></div>
                </div>
                <div className="bar-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
