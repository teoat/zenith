import { useState } from 'react';
import ConclusionWizard from './ConclusionWizard';
import DossierExport from './DossierExport';
import { FileText, Download, CheckCircle } from 'lucide-react';

const ReportBuilder = () => {
  const [activeView, setActiveView] = useState<'wizard' | 'export'>('wizard');
  const [isConcluded, setIsConcluded] = useState(false);

  const handleConclusionComplete = () => {
    setIsConcluded(true);
    setActiveView('export');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[600px] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar / Navigation */}
      <div className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 px-2">Builder Tools</h3>
        
        <nav className="space-y-2">
          <button
            onClick={() => setActiveView('wizard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'wizard'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <div className={`p-1.5 rounded-md ${isConcluded ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
              {isConcluded ? <CheckCircle size={14} /> : <FileText size={14} />}
            </div>
            Case Conclusion
          </button>

          <button
            onClick={() => setActiveView('export')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'export'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <div className="p-1.5 rounded-md bg-slate-200 text-slate-500">
              <Download size={14} />
            </div>
            Export Dossier
          </button>
        </nav>

        {isConcluded && (
          <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg">
            <p className="text-xs text-green-800 dark:text-green-300 font-medium flex items-center gap-2">
              <CheckCircle size={12} />
              Case Concluded
            </p>
            <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">
              Ready for export.
            </p>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'wizard' ? (
          <div className="h-full">
            <ConclusionWizard onComplete={handleConclusionComplete} />
          </div>
        ) : (
          <div className="p-8 h-full">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Export Final Report</h2>
              <p className="text-slate-500 mb-8">
                Generate a court-admissible dossier package including all evidence and chain of custody logs.
              </p>
              <DossierExport caseId="CASE-001" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportBuilder;
