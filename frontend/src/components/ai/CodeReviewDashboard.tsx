import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { secureLogger } from "@/utils/secureLogger";
import type { CodeIssue } from "@/types/code-review";
import { AnalysisResultSchema, type AnalysisResult } from "@/lib/schemas";

const CodeReviewDashboard: React.FC = () => {
  const [reviewResult, setReviewResult] = useState<AnalysisResult | null>(null);
  const [, setTestSuggestions] = useState<
    {
      test_type: string;
      code_snippet: string;
      target_function: string;
      justification: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const loadCodeReviewData = useCallback(async () => {
    setLoading(true);
    try {
      const sampleCode = `
def get_user_data(user_id):
    # Potential SQL Injection
    query = f"SELECT * FROM users WHERE id = {user_id}"
    api_key = process.env.API_KEY  # Use environment variable
    return db.execute(query)
      `;

      const aiData = await fetch("/ai/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: sampleCode,
          language: "python",
          file_path: "backend/security_scan_sample.py",
          context: { analysis_depth: "deep" },
        }),
      }).then((res) => res.json());

      const aiIssues: CodeIssue[] = aiData.issues.map((issue: any) => {
        let codeSnippetLine = "";
        if (issue.line_number === 4) {
          codeSnippetLine = `00004:     query = f"SELECT * FROM users WHERE id = {user_id}"`;
        } else if (issue.line_number === 5) {
          codeSnippetLine = `00005:     api_key = process.env.API_KEY  # Use environment variable`;
        } else {
          codeSnippetLine = `0000${issue.line_number}: ${issue.code_snippet || "..."}`;
        }

        return {
          file_path: issue.file_path,
          line_number: issue.line_number,
          issue_type: issue.issue_type,
          category: issue.category,
          severity: issue.severity,
          message: issue.message,
          code_snippet: codeSnippetLine,
          fix_suggestion: issue.fix_suggestion,
          confidence_score: issue.confidence_score,
        };
      });

      const issuesByCategory = aiIssues.reduce(
        (acc, issue) => {
          acc[issue.category] = (acc[issue.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const issuesBySeverity = aiIssues.reduce(
        (acc, issue) => {
          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const linesOfCode = sampleCode.split("\n").length;
      const maintainabilityIndex = Math.max(
        0,
        100 -
          (issuesBySeverity["critical"] * 10 + issuesBySeverity["high"] * 5),
      );

      const realResult = AnalysisResultSchema.parse({
        total_issues: aiIssues.length,
        issues_by_category: issuesByCategory,
        issues_by_severity: issuesBySeverity,
        avg_issues_per_file: aiIssues.length / 1,
        issues_per_1000_lines: (aiIssues.length / linesOfCode) * 1000,
        lines_of_code: linesOfCode,
        files_analyzed: 1,
        test_coverage_estimate: 85,
        maintainability_index: maintainabilityIndex,
        analysis_time_seconds: aiData.analysis_time_seconds || 1.5,
        generated_at: new Date().toISOString(),
      });

      const mockSuggestions = [
        {
          test_type: "unit_test",
          code_snippet:
            'def test_get_user_data():\n    # Test cases for user data retrieval\n    assert get_user_data(1) == "expected_data"',
          target_function: "get_user_data",
          justification:
            "Add unit tests to prevent SQL injection and validate inputs",
        },
      ];

      setReviewResult(realResult);
      setTestSuggestions(mockSuggestions);

      secureLogger.info("CodeReview: Analysis completed", {
        issuesFound: aiIssues.length,
        maintainabilityScore: maintainabilityIndex,
      });
    } catch (error) {
      secureLogger.error("CodeReview: Analysis failed", error);
      setReviewResult(null);
      setTestSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setReviewResult, setTestSuggestions]);

  const displayResult = useMemo(() => {
    return (
      reviewResult || {
        total_issues: 0,
        issues_by_category: {},
        issues_by_severity: {},
        avg_issues_per_file: 0,
        issues_per_1000_lines: 0,
        lines_of_code: 0,
        files_analyzed: 0,
        test_coverage_estimate: 0,
        maintainability_index: 0,
        analysis_time_seconds: 0,
        generated_at: new Date().toISOString(),
      }
    );
  }, [reviewResult]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Code Review Dashboard
          </h2>
          <p className="text-gray-600 mb-6">
            AI-powered code analysis with security vulnerability detection.
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={loadCodeReviewData}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {loading ? "Analyzing..." : "Analyze Code"}
          </button>
        </div>

        <AnimatePresence>
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-transparent animate-spin rounded-full"></div>
            </div>
          )}
        </AnimatePresence>

        {!loading && displayResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 border rounded-lg">
                <h3 className="text-lg font-semibold text-blue-600">
                  {displayResult.total_issues}
                </h3>
                <p className="text-gray-600">Total Issues Found</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CodeReviewDashboard;
