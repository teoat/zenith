// frontend/src/components/ai/CodeReviewDashboard.tsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Code,
  Download,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

import { CodeReviewResult, TestSuggestion } from '@/types/code-review';
import { CodeReviewOverview } from '@/components/features/code-review/CodeReviewOverview';
import { CodeIssuesList } from '@/components/features/code-review/CodeIssuesList';
import { CodeMetricsPanel } from '@/components/features/code-review/CodeMetricsPanel';
import { TestSuggestionsList } from '@/components/features/code-review/TestSuggestionsList';

const CodeReviewDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'metrics' | 'tests'>('overview');
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);
  const [testSuggestions, setTestSuggestions] = useState<TestSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadCodeReviewData();
  }, []);

  const loadCodeReviewData = async () => {
    setLoading(true);
    try {
      // Mock data - would be replaced with actual API call
      const mockResult: CodeReviewResult = {
        repository: "fraud-detection-platform",
        branch: "main",
        commit_hash: "a1b2c3d4e5f6",
        files_analyzed: 45,
        total_lines: 12580,
        quality_score: 87.5,
        quality_rating: "good",
        issues: [
          {
            file_path: "backend/app/services/ai_service.py",
            line_number: 142,
            issue_type: "hardcoded_secrets",
            category: "security",
            severity: "critical",
            title: "Hardcoded API Key Detected",
            description: "Potential hardcoded API key found in source code",
            code_snippet: "00140:     api_key = \"sk-1234567890abcdef\"\n00141:     headers = {\"Authorization\": f\"Bearer {api_key}\"}\n00142:     response = requests.get(url, headers=headers)",
            suggestion: "Use environment variables or secure credential storage",
            confidence_score: 0.95,
            cwe_id: "CWE-798",
            owasp_id: "A05:2021-Security Misconfiguration",
            references: ["OWASP Top 10", "CWE-798"]
          },
          {
            file_path: "frontend/src/components/Dashboard.tsx",
            line_number: 89,
            issue_type: "console_statements",
            category: "performance",
            severity: "warning",
            title: "Console Statement in Production",
            description: "Console statements should be removed for production builds",
            code_snippet: "00087:   const handleSubmit = (data) => {\n00088:     console.log('Form submitted:', data);\n00089:     // Process form data\n00090:   };",
            suggestion: "Remove console statements or use proper logging",
            confidence_score: 0.88,
            references: []
          },
          {
            file_path: "backend/app/models/user.py",
            line_number: 234,
            issue_type: "sql_injection_risk",
            category: "security",
            severity: "error",
            title: "SQL Injection Vulnerability",
            description: "String formatting used in SQL query",
            code_snippet: "00232:   def get_user(self, user_id):\n00233:     query = f\"SELECT * FROM users WHERE id = {user_id}\"\n00234:     return self.db.execute(query)",
            suggestion: "Use parameterized queries or prepared statements",
            confidence_score: 0.92,
            cwe_id: "CWE-89",
            owasp_id: "A03:2021-Injection",
            references: ["OWASP Top 10", "CWE-89"]
          }
        ],
        metrics: {
          total_issues: 12,
          issues_by_category: {
            security: 5,
            performance: 3,
            maintainability: 2,
            reliability: 1,
            compliance: 1,
            best_practice: 0
          },
          issues_by_severity: {
            critical: 2,
            error: 4,
            warning: 5,
            info: 1
          },
          avg_issues_per_file: 0.27,
          issues_per_1000_lines: 0.95,
          lines_of_code: 12580,
          files_analyzed: 45,
          test_coverage_estimate: 78,
          maintainability_index: 82.5
        },
        generated_at: new Date().toISOString(),
        analysis_time_seconds: 45.2
      };

      const mockTestSuggestions: TestSuggestion[] = [
        {
          test_type: "unit_test",
          description: "Test authentication service token validation",
          code_example: "def test_token_validation():\n    service = AuthService()\n    token = service.generate_token(user_id=123)\n    assert service.validate_token(token) == 123",
          coverage_areas: ["token_validation", "error_handling", "edge_cases"],
          priority: "high",
          complexity: "medium"
        },
        {
          test_type: "integration_test",
          description: "Test user registration API endpoint",
          code_example: "def test_user_registration():\n    response = client.post('/api/users', json=user_data)\n    assert response.status_code == 201\n    assert 'id' in response.json()",
          coverage_areas: ["api_endpoints", "data_validation", "database_integration"],
          priority: "high",
          complexity: "medium"
        }
      ];

      setReviewResult(mockResult);
      setTestSuggestions(mockTestSuggestions);
    } catch (err) {
      console.error('Failed to load code review data:', err);
    } finally {
      setLoading(false);
    }
  };

  const runCodeAnalysis = async () => {
    setAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await loadCodeReviewData();
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'error': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-slate-600">Loading Code Review Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
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
             <Button
                onClick={runCodeAnalysis}
                disabled={analyzing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
             >
                {analyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {analyzing ? 'Analyzing...' : 'Run Analysis'}
             </Button>
             <Button variant="outline" className="bg-white">
                <Download className="w-4 h-4 mr-2" />
                Export
             </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6 bg-white p-1 rounded-t-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'issues', label: 'Issues', icon: AlertTriangle },
          { id: 'metrics', label: 'Metrics', icon: TrendingUp },
          { id: 'tests', label: 'Test Suggestions', icon: CheckCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <CodeReviewOverview
            key="overview"
            reviewResult={reviewResult}
          />
        )}

        {activeTab === 'issues' && (
          <CodeIssuesList
            key="issues"
            issues={reviewResult?.issues || []}
            getSeverityColor={getSeverityColor}
          />
        )}

        {activeTab === 'metrics' && reviewResult && (
          <CodeMetricsPanel
            key="metrics"
            metrics={reviewResult.metrics}
          />
        )}

        {activeTab === 'tests' && (
          <TestSuggestionsList
            key="tests"
            suggestions={testSuggestions}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodeReviewDashboard;