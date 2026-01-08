import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { ComplianceCheck, ComplianceRule } from '@/types/compliance';
import { cn } from '@/lib/utils';

interface ComplianceOverviewProps {
  complianceChecks: ComplianceCheck[];
  monitoringActive: boolean;
  complianceRules: ComplianceRule[];
  getFrameworkDisplayName: (fw: string) => string;
}

export const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({
  complianceChecks,
  monitoringActive,
  complianceRules,
  getFrameworkDisplayName
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content space-y-6"
    >
      {/* Monitoring Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            {monitoringActive ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <Clock className="w-6 h-6 text-slate-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Regulatory Monitoring</h3>
            <p className="text-slate-600 mt-1">
              {monitoringActive
                ? 'Active - Real-time compliance monitoring across all frameworks'
                : 'Inactive - Click "Start Monitoring" to begin regulatory surveillance'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Critical Issues */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Critical Compliance Issues</h3>
        <div className="space-y-4">
          {complianceChecks.filter(check => check.status === 'non_compliant').map((check, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-md">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {check.entity_type} {check.entity_id} failed {check.rule_id.replace('_', ' ')}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {new Date(check.checked_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {complianceChecks.filter(check => check.status === 'non_compliant').length === 0 && (
            <p className="text-slate-500 italic">No critical issues detected.</p>
          )}
        </div>
      </div>

      {/* Framework Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Regulatory Framework Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['us_patriot_act', 'amld5', 'mas_notice_626', 'gdpr', 'sox'].map((framework, index) => {
            const frameworkChecks = complianceChecks.filter(c =>
              complianceRules.find(r => r.rule_id === c.rule_id)?.framework === framework
            );
            const compliantCount = frameworkChecks.filter(c => c.status === 'compliant').length;
            const totalCount = frameworkChecks.length;
            const complianceRate = totalCount > 0 ? (compliantCount / totalCount) * 100 : 100;
            const isCompliant = complianceRate >= 95;

            return (
              <div key={index} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-slate-900">{getFrameworkDisplayName(framework)}</h4>
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-bold rounded",
                    isCompliant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}>
                    {isCompliant ? 'COMPLIANT' : 'REVIEW NEEDED'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span className="font-medium">{complianceRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Checks:</span>
                    <span className="font-medium">{totalCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
