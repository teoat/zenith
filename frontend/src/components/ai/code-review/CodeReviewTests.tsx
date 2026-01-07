import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import type { TestSuggestion } from "@/types/code-review";

interface CodeReviewTestsProps {
  testSuggestions: TestSuggestion[];
}

export const CodeReviewTests: React.FC<CodeReviewTestsProps> = ({
  testSuggestions,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="test-suggestions">
        <h3 className="section-title">AI-Generated Test Suggestions</h3>
        <p className="section-description">
          Based on code analysis, here are recommended test cases to improve
          coverage and reliability.
        </p>

        <div className="suggestions-list">
          {testSuggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-card">
              <div className="suggestion-header">
                <div className="suggestion-type">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>
                    {suggestion.test_type.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div className="suggestion-priority">
                  <span
                    className={`priority-badge priority-${suggestion.priority}`}
                  >
                    {suggestion.priority}
                  </span>
                </div>
              </div>

              <div className="suggestion-description">
                <p>{suggestion.description}</p>
              </div>

              <div className="suggestion-code">
                <h5 className="code-title">Example Implementation:</h5>
                <pre className="code-block">
                  <code>{suggestion.code_example}</code>
                </pre>
              </div>

              <div className="suggestion-coverage">
                <h5 className="coverage-title">Coverage Areas:</h5>
                <div className="coverage-tags">
                  {suggestion.coverage_areas.map((area, areaIndex) => (
                    <span key={areaIndex} className="coverage-tag">
                      {area.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div className="suggestion-complexity">
                <span className="complexity-label">Complexity:</span>
                <span
                  className={`complexity-value complexity-${suggestion.complexity}`}
                >
                  {suggestion.complexity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
