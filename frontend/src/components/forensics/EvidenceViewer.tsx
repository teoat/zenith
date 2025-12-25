import React from 'react';
import type { EvidenceItem } from '../../lib/api';

interface EvidenceViewerProps {
  selectedEvidence: EvidenceItem | null;
  onEvidenceChange: (id: string) => void;
}

const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  selectedEvidence
}) => {
  if (!selectedEvidence) {
    return (
      <div className="flex-1 bg-slate-950 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            📄
          </div>
          <h3 className="text-lg font-medium mb-2">Select Evidence</h3>
          <p className="text-sm">Choose an evidence item from the list to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 flex flex-col">
      <div className="h-14 border-b border-slate-800 bg-slate-900 flex items-center px-6">
        <h1 className="font-bold text-slate-100">
          {selectedEvidence.fileName}
        </h1>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-slate-900 rounded-lg p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                File Type
              </label>
              <span className="text-slate-200">{selectedEvidence.fileType}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Upload Date
              </label>
              <span className="text-slate-200">
                {new Date(selectedEvidence.uploadedAt).toLocaleString()}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Case ID
              </label>
              <span className="text-slate-200">{selectedEvidence.caseId}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                File Size
              </label>
              <span className="text-slate-200">
                {Math.round(selectedEvidence.sizeBytes / 1024)} KB
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-lg font-medium text-slate-200 mb-4">Evidence Preview</h3>
            <div className="bg-slate-950 border border-slate-800 rounded p-4 min-h-64 flex items-center justify-center text-slate-500">
              Preview not available for this file type
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceViewer;