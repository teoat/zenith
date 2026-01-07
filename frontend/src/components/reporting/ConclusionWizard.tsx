import React, { useState } from 'react';
import { CheckCircle, ChevronRight, FileText, Shield, Eye, Send, ArrowLeft } from 'lucide-react';
import { secureLogger } from '@/utils/secureLogger';

const STEPS = [
  { id: 1, name: 'Summary', icon: FileText },
  { id: 2, name: 'Findings', icon: Shield },
  { id: 3, name: 'Review', icon: Eye },
  { id: 4, name: 'Submit', icon: Send },
];

interface ConclusionWizardProps {
  caseId?: string;
  onComplete?: () => void;
}

const ConclusionWizard: React.FC<ConclusionWizardProps> = ({ caseId: _caseId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    summary: '',
    findings: '',
    recommendation: 'escalate',
    notes: '',
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit
      secureLogger.info('Submitting case conclusion:', formData);
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 py-6 border-b border-slate-200 dark:border-slate-800">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentStep === step.id
                ? 'bg-blue-600 text-white shadow-lg'
                : currentStep > step.id
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {currentStep > step.id ? (
                <CheckCircle size={16} />
              ) : (
                <step.icon size={16} />
              )}
              <span className="hidden sm:inline">{step.name}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <ChevronRight size={16} className="text-slate-300" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold">Case Summary</h2>
            <p className="text-slate-500">Provide a brief overview of the investigation and outcome.</p>
            <div className="relative">
              <textarea
                className="w-full h-40 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder="Write a summary of the case investigation..."
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, summary: 'Based on the analysis of 47 transactions between December 1-8, 2025, the investigation identified a clear structuring pattern. Multiple cash deposits under $10,000 were made across 5 bank branches within a 48-hour period, totaling $45,200. The subject, John Doe, is linked to Shell Corp LLC, a company registered in the Cayman Islands with no public financial records. AI analysis indicates a 92% probability of intentional structuring to evade BSA reporting requirements.' })}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs font-bold rounded-lg shadow-lg transition-all"
              >
                ✨ AI Writer
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold">Key Findings</h2>
            <p className="text-slate-500">Document the evidence and conclusions.</p>
            <textarea
              className="w-full h-32 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="List key findings and evidence..."
              value={formData.findings}
              onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
            />
            <div>
              <label htmlFor="recommendation-select" className="block font-medium mb-2">Recommendation</label>
              <select
                id="recommendation-select"
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                value={formData.recommendation}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              >
                <option value="escalate">Escalate to Compliance</option>
                <option value="close_confirmed">Close as Confirmed Fraud</option>
                <option value="close_false_positive">Close as False Positive</option>
                <option value="needs_more_info">Needs More Information</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold">Review Submission</h2>
            <p className="text-slate-500">Verify the information before submitting.</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 space-y-4 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Summary</span>
                <p className="text-slate-700 dark:text-slate-200">{formData.summary || <i className="text-slate-400">Not provided</i>}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Findings</span>
                <p className="text-slate-700 dark:text-slate-200">{formData.findings || <i className="text-slate-400">Not provided</i>}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Recommendation</span>
                <p className="font-medium text-blue-600">{formData.recommendation.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="text-center space-y-6 animate-in fade-in pt-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Ready to Submit</h2>
            <p className="text-slate-500">Click submit to finalize this case conclusion. This action cannot be undone.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-between bg-white dark:bg-slate-900">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
        >
          {currentStep === STEPS.length ? 'Submit Conclusion' : 'Continue'}
          {currentStep !== STEPS.length && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
};

export default ConclusionWizard;
