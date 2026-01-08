import React from 'react';
import { motion } from 'framer-motion';
import { ComplianceRule } from '@/types/compliance';
import { cn } from '@/lib/utils';

interface ComplianceRulesListProps {
  complianceRules: ComplianceRule[];
  getFrameworkDisplayName: (fw: string) => string;
  getRiskColor: (risk: string) => string;
}

export const ComplianceRulesList: React.FC<ComplianceRulesListProps> = ({
  complianceRules,
  getFrameworkDisplayName,
  getRiskColor
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Compliance Rules by Framework</h3>

        <div className="space-y-6">
          {complianceRules.map((rule, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">{rule.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{getFrameworkDisplayName(rule.framework)}</p>
                </div>
                <div className="flex gap-2">
                  <span className={cn("px-2 py-1 text-xs font-bold rounded uppercase", getRiskColor(rule.risk_level))}>
                    {rule.risk_level}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                    {rule.check_frequency}
                  </span>
                </div>
              </div>

              <div className="text-sm text-slate-700 mb-4 bg-slate-50 p-3 rounded">
                <p>{rule.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-600">Automated Check:</span>
                  <span className="font-medium text-slate-900">{rule.automated_check ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-600">Manual Review:</span>
                  <span className="font-medium text-slate-900">{rule.manual_review_required ? 'Required' : 'Not Required'}</span>
                </div>
              </div>

              {rule.remediation_steps.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Remediation Steps:</h5>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                    {rule.remediation_steps.map((step, stepIndex) => (
                      <li key={stepIndex}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {rule.reference_links.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">References:</h5>
                  <div className="space-y-1">
                    {rule.reference_links.map((link, linkIndex) => (
                      <a 
                        key={linkIndex} 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:underline truncate"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
