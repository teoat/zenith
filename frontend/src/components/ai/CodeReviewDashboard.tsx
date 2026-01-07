import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Code,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  RefreshCw,
  TrendingUp,
  BarChart3
} from 'lucide-react';

import { useCodeReview } from '@/hooks/useCodeReview';
import { CodeReviewOverview } from '@/components/ai/code-review/CodeReviewOverview';
import { CodeReviewIssues } from '@/components/ai/code-review/CodeReviewIssues';
import { CodeReviewMetrics } from '@/components/ai/code-review/CodeReviewMetrics';
import { CodeReviewTests } from '@/components/ai/code-review/CodeReviewTests';

const CodeReviewDashboard: React.FC = () => {
  type TabId = 'overview' | 'issues' | 'metrics' | 'tests';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  
  const { 
    reviewResult, 
    testSuggestions, 
    loading, 
    analyzing, 
    loadCodeReviewData, 
    runAnalysis 
  } = useCodeReview();

  useEffect(() => {
    loadCodeReviewData();
  }, [loadCodeReviewData]);

  if (loading && !reviewResult) {
    return (
      <div className="code-review-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-slate-600">Loading Code Review Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="code-review-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Code className="w-8 h-8 text-blue-600 mr-3" />
              AI-Powered Code Review
            </h1>
            <p className="text-slate-600 mt-1">
              Automated code quality analysis and security vulnerability detection
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {analyzing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {analyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
            <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Quality Score Overview */}
      {reviewResult && (
        <div className="quality-overview">
          <div className="quality-score-card">
            <div className="score-display">
              <div className="score-value">{reviewResult.quality_score.toFixed(1)}</div>
              <div className="score-label">Quality Score</div>
            </div>
            <div className="score-rating">
              <span className={`rating-badge rating-${reviewResult.quality_rating}`}>
                {reviewResult.quality_rating.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="overview-metrics">
            <div className="metric-item">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <div className="metric-value">{reviewResult.files_analyzed}</div>
                <div className="metric-label">Files Analyzed</div>
              </div>
            </div>
            <div className="metric-item">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <div className="metric-value">{reviewResult.metrics.total_issues}</div>
                <div className="metric-label">Issues Found</div>
              </div>
            </div>
            <div className="metric-item">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <div className="metric-value">{reviewResult.analysis_time_seconds.toFixed(1)}s</div>
                <div className="metric-label">Analysis Time</div>
              </div>
            </div>
            <div className="metric-item">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <div className="metric-value">{reviewResult.metrics.test_coverage_estimate}%</div>
                <div className="metric-label">Test Coverage</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'issues', label: 'Issues', icon: AlertTriangle },
          { id: 'metrics', label: 'Metrics', icon: TrendingUp },
          { id: 'tests', label: 'Test Suggestions', icon: CheckCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && reviewResult && (
          <CodeReviewOverview reviewResult={reviewResult} />
        )}

        {activeTab === 'issues' && reviewResult && (
          <CodeReviewIssues reviewResult={reviewResult} />
        )}

        {activeTab === 'metrics' && reviewResult && (
          <CodeReviewMetrics reviewResult={reviewResult} />
        )}

        {activeTab === 'tests' && (
          <CodeReviewTests testSuggestions={testSuggestions} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodeReviewDashboard;