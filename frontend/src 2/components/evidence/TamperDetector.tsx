import React, { useMemo } from 'react';
import { AlertTriangle, ShieldCheck, FileSignature } from 'lucide-react';
import { EvidenceItem } from '../../lib/api';

interface TamperDetectorProps {
  evidence: EvidenceItem | null;
  className?: string;
}

export const TamperDetector: React.FC<TamperDetectorProps> = ({ evidence, className = '' }) => {
  // Memoize the date calculation - must be called before any conditional returns
  const suspiciousModifiedDate = useMemo(() => {
    // Using a stable reference date for consistency
    const referenceDate = new Date();
    referenceDate.setDate(referenceDate.getDate() - 1);
    return referenceDate.toISOString();
  }, []);

  if (!evidence) {
    return (
      <div className={`p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 text-center ${className}`}>
        <ShieldCheck className="mx-auto text-slate-400 mb-2" size={24} />
        <p className="text-sm text-slate-500">Select a file to run tamper analysis</p>
      </div>
    );
  }

  // Mock Analysis Logic
  const isSuspicious = evidence.fileType === 'pdf' && evidence.sizeBytes > 5000000; // Mock rule
  const metadata = {
      software: isSuspicious ? 'Adobe Photoshop CC 2023' : 'QuickBooks v22.0',
      created: evidence.uploadedAt,
      modified: isSuspicious ? suspiciousModifiedDate : evidence.uploadedAt,
      author: isSuspicious ? 'unknown_user' : 'accounting_bot',
  };

  const flags = isSuspicious ? [
      { id: 1, severity: 'high', message: 'Metadata indicates editing software (Photoshop) used on invoice.' },
      { id: 2, severity: 'medium', message: 'Creation date matches modification date.' },
  ] : [];

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <FileSignature size={16} className="text-purple-500" />
              Forensic Analysis
          </h3>
          {isSuspicious ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                  TAMPERING DETECTED
              </span>
          ) : (
             <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
                  VERIFIED AUTHENTIC
              </span>
          )}
      </div>

      {/* Flags List */}
      {flags.length > 0 && (
          <div className="space-y-2">
              {flags.map(flag => (
                  <div key={flag.id} className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-md flex gap-3 items-start">
                      <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                          <p className="text-xs font-semibold text-red-700 dark:text-red-300">Potential Tampering</p>
                          <p className="text-xs text-red-600 dark:text-red-400">{flag.message}</p>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* Metadata Check */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Metadata Signature</h4>
          <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                  <span className="text-slate-500">Software:</span>
                  <span className={`font-mono ${isSuspicious ? 'text-red-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                      {metadata.software}
                  </span>
              </div>
              <div className="flex justify-between">
                  <span className="text-slate-500">Author:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono">{metadata.author}</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-slate-500">Hash (SHA-256):</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono truncate max-w-[150px]" title="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855">
                      e3b0c442...b855
                  </span>
              </div>
          </div>
      </div>
      
      {!isSuspicious && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-900/10 rounded border border-green-100 dark:border-green-900/30">
              <ShieldCheck size={14} />
              <span>Chain of Custody unbroken since ingest.</span>
          </div>
      )}

    </div>
  );
};
