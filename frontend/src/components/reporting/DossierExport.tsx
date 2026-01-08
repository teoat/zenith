import React, { useState } from 'react';
import { FileOutput, Download, Mail, Printer, Check, Loader2, FileText, Shield, User, Calendar } from 'lucide-react';

interface DossierExportProps {
  caseId: string;
  onExport?: (format: string) => void;
}

const DossierExport: React.FC<DossierExportProps> = ({ caseId, onExport }) => {
  const [selectedFormat, setSelectedFormat] = useState<'html' | 'pdf' | 'docx'>('html');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [includeSections, setIncludeSections] = useState({
    summary: true,
    timeline: true,
    evidence: true,
    entities: true,
    findings: true,
    signatures: true,
  });

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);
    
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsExporting(false);
    setExportComplete(true);
    onExport?.(selectedFormat);
    
    // Reset after 3 seconds
    setTimeout(() => setExportComplete(false), 3000);
  };

  const formats = [
    { id: 'html', label: 'Self-Contained HTML', description: 'Single file, opens in any browser', icon: <FileText size={20} /> },
    { id: 'pdf', label: 'PDF Document', description: 'Print-ready format', icon: <FileOutput size={20} /> },
    { id: 'docx', label: 'Word Document', description: 'Editable in Microsoft Word', icon: <FileText size={20} /> },
  ];

  const sections = [
    { id: 'summary', label: 'Executive Summary', icon: <FileText size={14} /> },
    { id: 'timeline', label: 'Investigation Timeline', icon: <Calendar size={14} /> },
    { id: 'evidence', label: 'Evidence Index', icon: <Shield size={14} /> },
    { id: 'entities', label: 'Entity Profiles', icon: <User size={14} /> },
    { id: 'findings', label: 'Key Findings', icon: <FileText size={14} /> },
    { id: 'signatures', label: 'Digital Signatures', icon: <Check size={14} /> },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <FileOutput size={20} className="text-blue-500" />
          Export Dossier
        </h3>
        <p className="text-sm text-slate-500 mt-1">Generate a self-contained report for Case #{caseId}</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Format Selection */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Export Format</h4>
          <div className="grid grid-cols-3 gap-3">
            {formats.map(format => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id as any)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedFormat === format.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className={`mb-2 ${selectedFormat === format.id ? 'text-blue-600' : 'text-slate-400'}`}>
                  {format.icon}
                </div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">{format.label}</div>
                <div className="text-xs text-slate-500">{format.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section Selection */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Include Sections</h4>
          <div className="grid grid-cols-2 gap-2">
            {sections.map(section => (
              <label 
                key={section.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={includeSections[section.id as keyof typeof includeSections]}
                  onChange={(e) => setIncludeSections(prev => ({ ...prev, [section.id]: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-slate-500">{section.icon}</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">{section.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
            exportComplete
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50`}
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating...
            </>
          ) : exportComplete ? (
            <>
              <Check size={18} />
              Export Complete!
            </>
          ) : (
            <>
              <Download size={18} />
              Generate Dossier
            </>
          )}
        </button>
        <button className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <Mail size={18} className="text-slate-500" />
        </button>
        <button className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
          <Printer size={18} className="text-slate-500" />
        </button>
      </div>
    </div>
  );
};

export default DossierExport;
