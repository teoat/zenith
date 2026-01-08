import React from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  FileText,
  AlertTriangle,
  Clock,
  BarChart3,
  Shield,
  Zap,
  Target,
  CheckCircle,
  TrendingUp,
  Settings
} from 'lucide-react';
import { CodeReviewResult } from '@/types/code-review';
import { cn } from '@/lib/utils';

interface CodeReviewOverviewProps {
  reviewResult: CodeReviewResult | null;
}

export const CodeReviewOverview: React.FC<CodeReviewOverviewProps> = ({ reviewResult }) => {
  if (!reviewResult) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'performance': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'maintainability': return <Settings className="w-5 h-5 text-slate-500" />;
      case 'reliability': return <Target className="w-5 h-5 text-green-500" />;
      case 'compliance': return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case 'best_practice': return <TrendingUp className="w-5 h-5 text-orange-500" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-700 bg-green-50 border-green-200';
      case 'good': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content text-slate-900" 
    >
       {/* Quality Score Overview */}
       <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex flex-col items-center justify-center p-4 min-w-[200px] border-r border-slate-100 pr-8">
              <div className="text-4xl font-bold text-slate-900 mb-2">{reviewResult.quality_score.toFixed(1)}</div>
              <div className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">Quality Score</div>
              <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase border", getRatingColor(reviewResult.quality_rating))}>
                {reviewResult.quality_rating.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1 w-full">
                <div>
                   <div className="flex items-center gap-2 mb-1 text-slate-500 text-sm font-medium">
                      <FileText className="w-4 h-4" /> Analyzed
                   </div>
                   <div className="text-xl font-bold text-slate-900">{reviewResult.files_analyzed} <span className="text-sm font-normal text-slate-400">files</span></div>
                </div>
                 <div>
                   <div className="flex items-center gap-2 mb-1 text-slate-500 text-sm font-medium">
                      <AlertTriangle className="w-4 h-4" /> Issues
                   </div>
                   <div className="text-xl font-bold text-slate-900">{reviewResult.metrics.total_issues}</div>
                </div>
                 <div>
                   <div className="flex items-center gap-2 mb-1 text-slate-500 text-sm font-medium">
                      <Clock className="w-4 h-4" /> Time
                   </div>
                   <div className="text-xl font-bold text-slate-900">{reviewResult.analysis_time_seconds.toFixed(1)}s</div>
                </div>
                 <div>
                   <div className="flex items-center gap-2 mb-1 text-slate-500 text-sm font-medium">
                      <BarChart3 className="w-4 h-4" /> Coverage
                   </div>
                   <div className="text-xl font-bold text-slate-900">{reviewResult.metrics.test_coverage_estimate}%</div>
                </div>
            </div>
       </div>

      {/* Repository Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
        <h3 className="text-lg font-semibold mb-4">Repository Details</h3>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div className="flex items-center gap-3">
             <div className="bg-white p-2 rounded-md border border-slate-200">
               <GitBranch className="w-5 h-5 text-slate-500" />
             </div>
             <div>
               <div className="text-lg font-bold text-slate-900">{reviewResult.repository}</div>
               <div className="text-sm text-slate-500 font-mono">{reviewResult.branch}</div>
             </div>
          </div>
          <div className="flex gap-6 text-sm">
             <div>
               <span className="block text-slate-500 text-xs uppercase mb-1">Commit Hash</span>
               <code className="font-mono bg-slate-200 px-2 py-1 rounded text-slate-800">{reviewResult.commit_hash}</code>
             </div>
             <div>
               <span className="block text-slate-500 text-xs uppercase mb-1">Generated At</span>
               <span className="font-medium text-slate-900">{new Date(reviewResult.generated_at).toLocaleString()}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Issues by Category */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
        <h3 className="text-lg font-semibold mb-4">Issues by Category</h3>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             {Object.entries(reviewResult.metrics.issues_by_category).map(([category, count]) => (
                 <div key={category} className="flex flex-col items-center p-4 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="mb-2 bg-slate-50 p-3 rounded-full">
                       {getCategoryIcon(category)}
                    </div>
                    <span className="text-xl font-bold text-slate-900">{count}</span>
                    <span className="text-xs text-slate-500 uppercase mt-1 text-center">{category.replace('_', ' ')}</span>
                 </div>
             ))}
         </div>
      </div>

      {/* Recent Critical Issues */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-4">Recent Critical Issues</h3>
        <div className="space-y-4">
          {reviewResult.issues.slice(0, 5).map((issue, index) => (
             <div key={index} className="flex items-start gap-3 p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded">
                <AlertTriangle className={cn("w-5 h-5 shrink-0 mt-0.5",
                  issue.severity === 'critical' ? 'text-red-500' :
                  issue.severity === 'error' ? 'text-orange-500' :
                  issue.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{issue.title}</p>
                   <p className="text-xs text-slate-500 mt-1 truncate">
                    {issue.file_path}:{issue.line_number} • <span className="capitalize">{issue.category}</span> • <span className="uppercase">{issue.severity}</span>
                   </p>
                </div>
             </div>
          ))}
          {reviewResult.issues.length === 0 && (
             <p className="text-slate-500 italic text-center py-4">No critical issues found. Great job!</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
