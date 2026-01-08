import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { CodeIssue } from '@/types/code-review';
import { cn } from '@/lib/utils';

interface CodeIssuesListProps {
  issues: CodeIssue[];
  getSeverityColor: (severity: string) => string;
}

export const CodeIssuesList: React.FC<CodeIssuesListProps> = ({
  issues,
  getSeverityColor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         issue.file_path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content text-slate-900"
    >
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
         {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
               type="text"
               placeholder="Search issues by title, description or file..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
          </div>
          <div className="flex gap-4">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
        <div className="space-y-6">
           {filteredIssues.map((issue, index) => (
             <div key={index} className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                   <div className="flex-1">
                      <h4 className="text-lg font-semibold text-slate-900 mb-1">{issue.title}</h4>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-500 font-mono">
                         <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{issue.file_path}:{issue.line_number}</span>
                         <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-400"></span> {issue.category}</span>
                      </div>
                   </div>
                   <div className={cn(
                     "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border",
                     getSeverityColor(issue.severity)
                   )}>
                      {issue.severity}
                   </div>
                </div>

                <div className="text-slate-700 mb-4 bg-slate-50 p-3 rounded border-l-4 border-slate-300 text-sm">
                   {issue.description}
                </div>

                <div className="bg-slate-900 rounded-lg p-4 mb-4 overflow-x-auto relative group">
                   <div className="absolute right-2 top-2 text-xs text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity">Snippet</div>
                   <pre className="text-slate-100 font-mono text-xs leading-relaxed">
                      <code>{issue.code_snippet}</code>
                   </pre>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-sm">
                   <div>
                      <h5 className="font-bold text-slate-900 text-xs uppercase mb-2">Suggestion:</h5>
                      <p className="text-slate-600 bg-blue-50 p-2 rounded border border-blue-100 text-blue-900">
                         {issue.suggestion}
                      </p>
                   </div>
                   <div className="flex flex-col justify-between">
                      { (issue.cwe_id || issue.owasp_id) && (
                         <div className="mb-2">
                            <h5 className="font-bold text-slate-900 text-xs uppercase mb-2">References:</h5>
                            <div className="flex gap-2">
                               {issue.cwe_id && <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600 border border-slate-200">CWE-{issue.cwe_id}</span>}
                               {issue.owasp_id && <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600 border border-slate-200">{issue.owasp_id}</span>}
                            </div>
                         </div>
                      )}
                      <div className="self-end mt-2">
                         <span className="text-slate-400 text-xs mr-2">Confidence Score:</span>
                         <span className="font-bold text-slate-700">{(issue.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                   </div>
                </div>
             </div>
           ))}
           {filteredIssues.length === 0 && (
             <div className="text-center py-12 text-slate-500">
                <p>No issues found matching your filters.</p>
             </div>
           )}
        </div>
      </div>
    </motion.div>
  );
};
