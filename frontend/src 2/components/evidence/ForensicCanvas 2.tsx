import React, { useState } from 'react';
import React from 'react';
import { EvidenceItem } from '../../lib/api';
import { Eye, Binary, FileJson } from 'lucide-react';

const EvidenceViewer = React.lazy(() => import('./EvidenceViewer'));

interface ForensicCanvasProps {
  fileUrl: string | null;
  evidence: EvidenceItem | null;
}

export const ForensicCanvas: React.FC<ForensicCanvasProps> = ({ fileUrl, evidence }) => {
  // Feature flags for forensic viewing
  const enableAdvancedViewing = import.meta.env.VITE_ENABLE_ADVANCED_FORENSIC !== 'false';
  const useSimplePdfViewer = import.meta.env.VITE_USE_SIMPLE_PDF_VIEWER === 'true';

  const [viewMode, setViewMode] = useState<'visual' | 'hex' | 'metadata'>('visual');

  if (!fileUrl) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-500">
              <Eye size={48} className="mb-4 opacity-50" />
              <p className="text-lg">Select an evidence item to begin analysis</p>
          </div>
      );
  }

  // Show simplified view if advanced viewing is disabled
  if (!enableAdvancedViewing) {
    return (
      <div className="flex flex-col h-full bg-slate-950">
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <FileText size={48} className="mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Advanced Viewing Disabled</h3>
          <p className="text-sm text-center max-w-md">
            Forensic analysis features have been disabled to improve performance.
            Basic file information is still available in the evidence panel.
          </p>
          {fileUrl && (
            <div className="mt-4 text-xs text-slate-500">
              File: {evidence?.fileName}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Canvas Toolbar */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-2 gap-1 shrink-0">
          <button
            onClick={() => setViewMode('visual')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-colors ${
                viewMode === 'visual' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
              <Eye size={14} /> Visual
          </button>
          <button
            onClick={() => setViewMode('hex')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-colors ${
                viewMode === 'hex' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
              <Binary size={14} /> Hex View
          </button>
          <button
            onClick={() => setViewMode('metadata')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-colors ${
                viewMode === 'metadata' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
              <FileJson size={14} /> Exif Data
          </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
           {viewMode === 'visual' && (
               useSimplePdfViewer ? (
                   <iframe
                       src={fileUrl || undefined}
                       className="w-full h-full border-0"
                       title="Document Viewer"
                   />
               ) : (
                   <React.Suspense fallback={
                       <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                           <div className="text-center text-slate-400">
                               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                               <p>Loading document viewer...</p>
                           </div>
                       </div>
                   }>
                       <EvidenceViewer fileUrl={fileUrl} />
                   </React.Suspense>
               )
           )}

          {viewMode === 'hex' && (
              <div className="absolute inset-0 overflow-auto p-4 font-mono text-xs text-green-500 bg-slate-950 leading-relaxed whitespace-pre-wrap select-text">
                  {/* Mock Hex Dump */}
                  <div className="grid grid-cols-[auto_1fr] gap-4">
                      <div className="text-slate-600 select-none">
                          {Array.from({ length: 20 }).map((_, i) => (
                              <div key={i}>{(i * 16).toString(16).padStart(8, '0').toUpperCase()}</div>
                          ))}
                      </div>
                      <div>
                          {Array.from({ length: 20 }).map((_, i) => (
                              <div key={i} className="flex gap-2">
                                  <span className="hover:bg-slate-800 cursor-pointer">25 50 44 46 2d 31 2e 35 0d 0a 25 b5 b5 b5 b5 0d</span>
                                  <span className="text-slate-500 border-l border-slate-800 pl-2">%PDF-1.5..%.....</span>
                              </div>
                          ))}
                      </div>
                  </div>
                  <p className="mt-4 text-slate-500 italic text-center">— End of Preview (First 320 bytes) —</p>
              </div>
          )}

          {viewMode === 'metadata' && (
              <div className="absolute inset-0 overflow-auto p-8">
                  <div className="max-w-2xl mx-auto bg-slate-900 rounded-lg border border-slate-800 p-6 font-mono text-sm shadow-xl">
                      <h3 className="text-slate-400 border-b border-slate-800 pb-2 mb-4 uppercase text-xs tracking-wider">File Metadata</h3>
                      <div className="grid grid-cols-[150px_1fr] gap-y-2">
                          <span className="text-blue-400">FileName</span>
                          <span className="text-slate-200">{evidence?.fileName}</span>

                          <span className="text-blue-400">FileSize</span>
                          <span className="text-slate-200">{evidence?.sizeBytes} bytes</span>

                          <span className="text-blue-400">FileType</span>
                          <span className="text-slate-200">{evidence?.fileType}</span>

                          <span className="text-blue-400">UploadedAt</span>
                          <span className="text-slate-200">{evidence?.uploadedAt}</span>

                          <div className="col-span-2 h-px bg-slate-800 my-2" />

                          <span className="text-purple-400">Exif.Image.Software</span>
                          <span className="text-slate-200">Adobe Photoshop CC 2023 (Macintosh)</span>

                          <span className="text-purple-400">Exif.Image.ModifyDate</span>
                          <span className="text-slate-200">2024:12:09 14:32:11</span>

                          <span className="text-purple-400">XMP.Did</span>
                          <span className="text-slate-200">xmp.did:48291048-2231-4122-8821</span>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
