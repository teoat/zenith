// pages/Forensics.tsx
import React, { useState, useEffect, Suspense } from 'react';
import { Folder, FileText, Search, Paperclip, Plus, AlertCircle } from 'lucide-react';
import { api, EvidenceItem } from '../lib/api';
import { API_BASE } from '../services/client'; // Import API_BASE
import LoadingState from '../components/LoadingState';
import { UploadWizard } from '../components/evidence/UploadWizard';
import { AccessibleButton } from '../components/ui/AccessibleButton';

// Lazy load heavy components
const ForensicCanvas = React.lazy(() => import('../components/evidence/ForensicCanvas').then(module => ({ default: module.ForensicCanvas })));
const TamperDetector = React.lazy(() => import('../components/evidence/TamperDetector').then(module => ({ default: module.TamperDetector })));
const MensReaAnalyzer = React.lazy(() => import('../components/evidence/MensReaAnalyzer').then(module => ({ default: module.MensReaAnalyzer })));
const HypothesisBoard = React.lazy(() => import('../components/evidence/HypothesisBoard').then(module => ({ default: module.HypothesisBoard })));

const Forensics = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadWizardOpen, setIsUploadWizardOpen] = useState(false);

  useEffect(() => {
    const fetchEvidence = async () => {
        try {
            setLoading(true);
            // Fetching evidence for current project
            const data = await api.getEvidence();
            setEvidence(data);
            setError(null);
            
            // Auto-select first item
            if (data.length > 0) {
                handleFileSelect(data[0]);
            }
        } catch (err) {
            console.error('Failed to fetch evidence:', err);
            setError('Failed to load evidence files. Please check connection.');
        } finally {
            setLoading(false);
        }
    };

    fetchEvidence();
  }, []);

  const [activeTab, setActiveTab] = useState<'EVIDENCE' | 'MENS_REA' | 'HYPOTHESIS'>('EVIDENCE');
  
  // Simple Drag Logic for Resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightPanelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth - (moveEvent.clientX - startX);
      setRightPanelWidth(Math.max(250, Math.min(600, newWidth)));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  
  
  const handleFileSelect = (item: EvidenceItem) => {
      // Construct URL for the backend download endpoint
      // Using direct URL construction as the backend now supports it
      const fileUrl = `${API_BASE}/evidence/${item.id}/download`;
      setSelectedFile(fileUrl);
      setSelectedEvidence(item);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUploadComplete = (files: any[]) => {
      // Mock update
      const newItems: EvidenceItem[] = files.map((f, i) => ({
          id: `new-${Date.now()}-${i}`,
          caseId: 'CASE-2024-001',
          fileName: f.name,
          fileType: f.type.includes('pdf') ? 'pdf' : 'image',
          sizeBytes: f.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Current User',
          filePath: '', // No real path
          hash: 'pending...'
      }));
      setEvidence(prev => [...newItems, ...prev]);
  };

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) return <LoadingState />;

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-950 text-red-400 gap-2">
            <AlertCircle size={24} />
            <p>{error}</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-950 text-slate-200">
      
      {/* Top Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 h-12 flex items-center gap-4 shrink-0">
         <button 
           onClick={() => setActiveTab('EVIDENCE')}
           className={`text-sm font-medium px-4 py-3 border-b-2 transition-colors ${activeTab === 'EVIDENCE' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
         >
            Evidence Board
         </button>
         <button 
           onClick={() => setActiveTab('MENS_REA')}
           className={`text-sm font-medium px-4 py-3 border-b-2 transition-colors ${activeTab === 'MENS_REA' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
         >
            Mens Rea Analysis
         </button>
         <button 
           onClick={() => setActiveTab('HYPOTHESIS')}
           className={`text-sm font-medium px-4 py-3 border-b-2 transition-colors ${activeTab === 'HYPOTHESIS' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
         >
            Hypothesis Testing
         </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 1. Left Sidebar: Evidence Locker (Always visible for now) */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
            <h2 className="font-bold flex items-center gap-2 text-slate-100">
                <Folder size={18} className="text-blue-500" />
                Evidence Locker
            </h2>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">{evidence.length}</span>
            </div>
            
            <div className="p-2 flex-1 overflow-y-auto">
            <div className="relative mb-4 px-2">
                <Search className="absolute left-4 top-2 text-slate-500" size={14} />
                <input 
                type="text" 
                placeholder="Filter chain of custody..." 
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
            </div>

            <div className="px-2 mb-4">
                <AccessibleButton 
                    onClick={() => setIsUploadWizardOpen(true)} 
                    size="sm" 
                    className="w-full justify-center"
                >
                    <Plus size={14} className="mr-1" /> Add Evidence
                </AccessibleButton>
            </div>

            <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-2 mt-4">
                Case #2024-001 Box
                </div>
                {evidence.map(file => (
                <button
                    key={file.id}
                    onClick={() => handleFileSelect(file)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all border ${
                    selectedEvidence?.id === file.id && activeTab === 'EVIDENCE'
                        ? 'bg-blue-900/20 text-blue-200 border-blue-500/30 shadow-sm' 
                        : 'border-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <div className={`p-2 rounded bg-slate-800 shrink-0 ${selectedEvidence?.id === file.id && activeTab === 'EVIDENCE' ? 'bg-blue-900/50 text-blue-400' : ''}`}>
                        {file.fileType === 'pdf' ? <FileText size={16} /> : <Paperclip size={16} />}
                    </div>
                    <div className="overflow-hidden min-w-0">
                        <span className="truncate text-sm font-medium block">{file.fileName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{formatSize(file.sizeBytes)} • {new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                </button>
                ))}
                {evidence.length === 0 && (
                    <div className="text-center p-8 text-slate-500 border border-dashed border-slate-800 rounded m-2">
                         {/* Empty state content */}
                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-slate-400 mb-2">No Evidence Yet</h4>
                    </div>
                )}
            </div>
            </div>
        </div>

        {/* 2. Main Area: Controlled by Active Tab */}
        <div className="flex-1 bg-slate-950 relative flex flex-col min-w-0 overflow-hidden">
            {activeTab === 'EVIDENCE' && (
                <div className="flex h-full w-full">
                    <div className="flex-1 relative">
                        <Suspense fallback={<LoadingState />}>
                            <ForensicCanvas fileUrl={selectedFile} evidence={selectedEvidence} />
                        </Suspense>
                    </div>
                    
                    {/* Resizer Handle */}
                    <button
                        className="w-1 bg-slate-800 hover:bg-blue-500 cursor-col-resize transition-colors z-10 hover:w-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onMouseDown={handleMouseDown}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            setRightPanelWidth(Math.max(200, rightPanelWidth - 20));
                          } else if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            setRightPanelWidth(Math.min(600, rightPanelWidth + 20));
                          }
                        }}
                        aria-label="Resize analysis panel"
                        aria-valuenow={rightPanelWidth}
                        aria-valuemin={200}
                        aria-valuemax={600}
                        type="button"
                    ></button>

                    {/* Right Sidebar */}
                    <div 
                        className="bg-slate-900 border-l border-slate-800 flex flex-col shrink-0"
                        style={{ width: rightPanelWidth }}
                    >
                        <div className="h-10 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900">
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Analysis Tools</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            <Suspense fallback={<div className="text-slate-500">Loading analysis tools...</div>}>
                                <TamperDetector evidence={selectedEvidence} />
                            </Suspense>
                            
                            {/* Notes Section */}
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 text-center">Case Notes</h4>
                                <textarea 
                                className="w-full h-32 bg-slate-900 border border-slate-800 rounded p-2 text-sm text-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none font-mono"
                                placeholder="Enter forensic observations..."
                                ></textarea>
                                <div className="mt-2 flex justify-end">
                                    <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-1 px-3 rounded transition-colors">
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'MENS_REA' && (
                <Suspense fallback={<LoadingState />}>
                    <MensReaAnalyzer evidence={evidence} />
                </Suspense>
            )}

            {activeTab === 'HYPOTHESIS' && (
                <Suspense fallback={<LoadingState />}>
                    <HypothesisBoard evidence={evidence} />
                </Suspense>
            )}
        </div>
      </div>

      {/* Modals */}
      <UploadWizard 
        isOpen={isUploadWizardOpen} 
        onClose={() => setIsUploadWizardOpen(false)} 
        onUploadComplete={handleUploadComplete} 
      />

    </div>
  );
};

export default Forensics;