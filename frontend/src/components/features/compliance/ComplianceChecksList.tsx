import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { ComplianceCheck, ComplianceRule } from '@/types/compliance';
import { cn } from '@/lib/utils';

interface ComplianceChecksListProps {
  complianceChecks: ComplianceCheck[];
  complianceRules: ComplianceRule[];
  onRunChecks: (ruleId: string, entityId: string) => void;
  getStatusColor: (status: string) => string;
}

export const ComplianceChecksList: React.FC<ComplianceChecksListProps> = ({
  complianceChecks,
  complianceRules,
  onRunChecks,
  getStatusColor
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Compliance Check Results</h3>
          <button
            onClick={() => onRunChecks('all', 'all')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Zap className="w-4 h-4 mr-2" />
            Run All Checks
          </button>
        </div>

        <div className="space-y-4">
          {complianceChecks.map((check, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="font-mono text-xs text-slate-500 mb-1">{check.check_id}</h4>
                  <p className="font-medium text-slate-900">
                    <span className="capitalize">{check.entity_type}</span>: {check.entity_id}
                  </p>
                </div>
                <div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase border",
                    getStatusColor(check.status)
                  )}>
                    {check.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-slate-50 p-3 rounded mb-4">
                <div>
                  <span className="text-slate-500 block text-xs">Rule</span>
                  <span className="font-medium text-slate-900 truncate block" title={check.rule_id}>
                    {complianceRules.find(r => r.rule_id === check.rule_id)?.title || check.rule_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Risk Score</span>
                  <span className="font-medium text-slate-900">{(check.risk_score * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Checked At</span>
                  <span className="font-medium text-slate-900">{new Date(check.checked_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Next Due</span>
                  <span className="font-medium text-slate-900">{new Date(check.next_check_due).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {check.findings.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-red-600 uppercase mb-2">Findings</h5>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                      {check.findings.map((finding, i) => (
                        <li key={i}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {check.recommendations.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-blue-600 uppercase mb-2">Recommendations</h5>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                      {check.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
