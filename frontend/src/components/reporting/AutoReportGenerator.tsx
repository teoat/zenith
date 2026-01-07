import React, { useState } from "react";
import { useToast } from "@/providers/ToastProvider";
import {
  FileText,
  CheckCircle,
  Download,
  FileCheck,
  Scale,
} from "lucide-react";
import { AccessibleButton } from "@/components/ui/AccessibleButton";

interface AutoReportGeneratorProps {
  caseId: string;
}

const AutoReportGenerator: React.FC<AutoReportGeneratorProps> = ({
  caseId: _caseId,
}) => {
  const [generating, setGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const { addToast } = useToast();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Mock generation delay
      await new Promise((r) => setTimeout(r, 2000));
      setReportReady(true);
      addToast("Report generated successfully", "success");
    } catch (e) {
      addToast("Failed to generate report", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-300">
          <FileText size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Automated Case Report
          </h3>
          <p className="text-slate-500 mb-4 text-sm">
            Generate a comprehensive, court-ready investigation summary using AI
            narrative generation.
          </p>

          {reportReady ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold mb-2">
                <CheckCircle size={18} /> Report Ready
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 rounded text-sm hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                  <FileCheck size={14} /> View HTML
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 rounded text-sm hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle size={14} className="text-green-500" /> Evidence
                Analysis
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle size={14} className="text-green-500" /> Narrative
                Construction
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Scale size={14} className="text-blue-500" /> Compliance Check
              </div>
            </div>
          )}

          <AccessibleButton
            onClick={handleGenerate}
            loading={generating}
            disabled={reportReady}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {reportReady ? "Regenerate Report" : "Generate Report"}
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
};

export default AutoReportGenerator;
