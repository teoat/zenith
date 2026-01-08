import React from 'react';
import { motion } from 'framer-motion';
import { ComplianceReport } from '@/types/compliance';
import { cn } from '@/lib/utils';

interface ComplianceReportsListProps {
  complianceReports: ComplianceReport[];
  getFrameworkDisplayName: (fw: string) => string;
  getStatusColor: (status: string) => string;
}

export const ComplianceReportsList: React.FC<ComplianceReportsListProps> = ({
  complianceReports,
  getFrameworkDisplayName,
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
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Compliance Reports</h3>
          <p className="text-slate-600">Comprehensive compliance assessments for regulatory frameworks.</p>
        </div>

        <div className="space-y-6">
          {complianceReports.map((report, index) => (
            <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-slate-900">{getFrameworkDisplayName(report.framework)} Report</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                  </p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase border",
                  getStatusColor(report.overall_status)
                )}>
                  {report.overall_status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Risk Summary</h5>
                  <div className="flex gap-4">
                    {Object.entries(report.risk_summary).map(([risk, count]) => (
                      <div key={risk} className="flex flex-col items-center bg-white border border-slate-200 rounded p-2 min-w-[80px]">
                        <span className="text-lg font-bold text-slate-900">{count}</span>
                        <span className="text-xs text-slate-500 capitalize">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {report.critical_findings.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-red-600 uppercase mb-2">Critical Findings</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                        {report.critical_findings.map((finding, i) => (
                          <li key={i}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-blue-600 uppercase mb-2">Recommendations</h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                        {report.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
