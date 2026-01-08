import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, FileText, CheckCircle } from 'lucide-react';
import { CodeReviewResult } from '@/types/code-review';

interface CodeMetricsPanelProps {
  metrics: CodeReviewResult['metrics'];
}

export const CodeMetricsPanel: React.FC<CodeMetricsPanelProps> = ({ metrics }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content text-slate-900"
    >
      {/* Key Metrics Grid */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
        <h3 className="text-lg font-semibold mb-6">Code Quality Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <div className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                 <BarChart3 className="w-5 h-5 text-blue-500" />
                 <h4 className="font-semibold text-sm text-slate-700">Maintainability Index</h4>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{metrics.maintainability_index.toFixed(1)}</div>
              <div className="text-xs text-slate-500">Higher is better (0-100 scale)</div>
           </div>

           <div className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                 <Target className="w-5 h-5 text-green-500" />
                 <h4 className="font-semibold text-sm text-slate-700">Issues / 1000 Lines</h4>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{metrics.issues_per_1000_lines.toFixed(2)}</div>
              <div className="text-xs text-slate-500">Lower is better</div>
           </div>

           <div className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                 <FileText className="w-5 h-5 text-purple-500" />
                 <h4 className="font-semibold text-sm text-slate-700">Avg Issues per File</h4>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{metrics.avg_issues_per_file.toFixed(2)}</div>
              <div className="text-xs text-slate-500">Lower is better</div>
           </div>

           <div className="border border-slate-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                 <CheckCircle className="w-5 h-5 text-orange-500" />
                 <h4 className="font-semibold text-sm text-slate-700">Test Coverage</h4>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">{metrics.test_coverage_estimate}%</div>
              <div className="text-xs text-slate-500">Estimated coverage</div>
           </div>
        </div>
      </div>

       {/* Severity Distribution */}
       <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
         <h3 className="text-lg font-semibold mb-6">Issues by Severity Distribution</h3>
         <div className="space-y-4">
            {Object.entries(metrics.issues_by_severity).map(([severity, count]) => (
               <div key={severity}>
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-sm font-medium capitalize text-slate-700">{severity}</span>
                     <span className="text-sm font-bold text-slate-900">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div
                       className={`h-full rounded-full ${
                          severity === 'critical' ? 'bg-red-500' :
                          severity === 'error' ? 'bg-orange-500' :
                          severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                       }`}
                       style={{ width: `${(count / metrics.total_issues) * 100}%` }}
                     />
                  </div>
               </div>
            ))}
         </div>
       </div>
    </motion.div>
  );
};
