import React, { useState, useEffect } from 'react';
import { useIngestionStore } from '../../stores/useIngestionStore';
import { useProjectStore } from '../../store/projectStore';
import FileDropZone from '../ui/FileDropZone';
import { DataMapping } from './DataMapping';
import { CheckCircle, AlertCircle, FileText, ArrowRight, ChevronRight, Upload } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../providers/ToastProvider';
import { AccessibleButton } from '../ui/AccessibleButton';
import ProgressBar from '../ui/ProgressBar';

const STEPS = [
    { id: 'upload', label: 'Upload Files' },
    { id: 'mapping', label: 'Map Columns' },
    { id: 'review', label: 'Review & Submit' }
];

export const IngestionStepper: React.FC = () => {
    const { 
        files, 
        addFiles, 
        processingResults, 
        setProcessingResults, 
        updateProcessingResult,
        reset 
    } = useIngestionStore();
    const { activeProjectId } = useProjectStore();
    
    const [currentStep, setCurrentStep] = useState(0);
    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { addToast } = useToast();

    // Reset store on mount
    useEffect(() => {
        reset();
    }, [reset]);

    const handleFilesDropped = async (droppedFiles: File[]) => {
        addFiles(droppedFiles);
        // Initialize processing results
        const newResults = droppedFiles.map(file => ({
            file,
            status: 'pending' as const,
            progress: 0,
            isPaused: false,
            isCancellable: true,
            isSaved: false
        }));
        
        setProcessingResults(prev => [...prev, ...newResults]);
        
        // Auto-advance to mapping if valid files
        if (droppedFiles.length > 0) {
            analyzeFiles(droppedFiles, newResults.length); 
        }
    };

    const analyzeFiles = async (filesToAnalyze: File[], startIndex: number) => {
        setIsAnalyzing(true);
        try {
             // Upload files to get Evidence IDs and initial analysis
             for (let i = 0; i < filesToAnalyze.length; i++) {
                 const file = filesToAnalyze[i];
                 const formData = new FormData();
                 formData.append('file', file);
                 formData.append('case_id', activeProjectId || 'CASE-INGESTION'); // Default bucket for ingestion
                 
                 try {
                     // Upload to Evidence Service
                     const response = await api.uploadEvidence(formData);
                     
                     // Mock detection of headers (since backend doesn't return them yet from analysis)
                     // In a real scenario, response.analysis_result would contain 'detected_headers'
                     const mockHeaders = ['Date', 'Post Date', 'Description', 'Amount', 'Debit', 'Credit', 'Merchant Name', 'Category', 'Reference'];
                     
                     // Generate preview data (mocked for now, implies backend could return this)
                     const rawPreviewData = Array(12).fill(0).map((_, idx) => ({
                         'Date': `2023-11-${10 + idx}`,
                         'Post Date': `2023-11-${12 + idx}`,
                         'Description': `Transaction ${idx + 1}`,
                         'Amount': (Math.random() * 1000).toFixed(2),
                         'Debit': (Math.random() * 1000).toFixed(2),
                         'Credit': '0.00',
                         'Merchant Name': `Vendor ${String.fromCharCode(65 + idx)}`,
                         'Category': 'General',
                         'Reference': `REF-${1000 + idx}`
                     }));

                     updateProcessingResult(startIndex + i, {
                         status: 'processing',
                         savedId: response.id, // Evidence ID from backend
                         detectedHeaders: mockHeaders,
                         rawPreviewData: rawPreviewData
                     });

                 } catch (err) {
                     console.error(`Failed to upload ${file.name}`, err);
                     updateProcessingResult(startIndex + i, { status: 'error', error: 'Upload failed' });
                 }
             }
             
             setCurrentStep(1); // Move to Mapping
             setActiveFileIndex(0); // Start mapping first file
             
        } catch (error) {
            console.error('Analysis failed', error);
            addToast('Failed to analyze files', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleMappingComplete = (mapping: Record<string, string>) => {
        // Save mapping for current file
        updateProcessingResult(activeFileIndex, { mappingConfig: mapping });
        
        // Move to next file or next step
        if (activeFileIndex < files.length - 1) {
            setActiveFileIndex(prev => prev + 1);
        } else {
            setCurrentStep(2); // Move to Review
        }
    };

    const handleBack = () => {
        if (activeFileIndex > 0) {
            setActiveFileIndex(prev => prev - 1);
        } else {
            setCurrentStep(Math.max(0, currentStep - 1));
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
            {/* Stepper Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-lg">
                <div className="flex items-center gap-2">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                                idx === currentStep 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium' 
                                    : idx < currentStep 
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-slate-400'
                            }`}>
                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs box-content border ${
                                    idx === currentStep ? 'bg-blue-600 text-white border-blue-600' :
                                    idx < currentStep ? 'bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                                    'border-slate-300'
                                }`}>
                                    {idx < currentStep ? <CheckCircle size={14} /> : idx + 1}
                                </span>
                                <span>{step.label}</span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <ChevronRight size={16} className="text-slate-300 mx-2" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-hidden min-h-0">
                {currentStep === 0 && (
                    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto space-y-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-2">Upload Bank Statements & Receipts</h2>
                            <p className="text-slate-500">Supported formats: CSV, Excel, PDF, Images</p>
                        </div>
                        
                        <div className="w-full">
                            <FileDropZone 
                                onFilesDropped={handleFilesDropped}
                                accept=".csv,.xlsx,.pdf,.jpg,.png"
                                multiple={true}
                            />
                            {isAnalyzing && (
                                <div className="mt-8">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Analyzing files...</span>
                                        <span>Detecting headers</span>
                                    </div>
                                    <ProgressBar progress={65} color="primary" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="h-full flex flex-col">
                         <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                Map Columns for <span className="text-blue-600">{files[activeFileIndex]?.name}</span>
                            </h2>
                            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                File {activeFileIndex + 1} of {files.length}
                            </span>
                         </div>
                         
                         {processingResults[activeFileIndex] && (
                             <DataMapping 
                                sourceColumns={processingResults[activeFileIndex].detectedHeaders || []}
                                previewData={processingResults[activeFileIndex].rawPreviewData || []}
                                onMappingComplete={handleMappingComplete}
                                onBack={handleBack}
                             />
                         )}
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
                        <h2 className="text-2xl font-bold mb-6">Review & Submit</h2>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
                             {processingResults.map((res, idx) => (
                                 <div key={idx} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex justify-between items-center">
                                     <div className="flex items-center gap-4">
                                         <div className="p-3 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 shadow-sm">
                                             <FileText className="text-blue-600" size={24} />
                                         </div>
                                         <div>
                                             <h4 className="font-semibold">{res.file.name}</h4>
                                             <p className="text-sm text-slate-500">
                                                 Mapped {Object.keys(res.mappingConfig || {}).length} fields
                                             </p>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         {res.status === 'error' ? (
                                             <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                                                 <AlertCircle size={16} /> Error
                                             </span>
                                         ) : (
                                              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                 <CheckCircle size={16} /> Ready
                                             </span>
                                         )}
                                     </div>
                                 </div>
                             ))}
                        </div>

                        <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                            <button 
                                onClick={handleBack}
                                className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium"
                            >
                                Back
                            </button>
                            <AccessibleButton
                                onClick={async () => {
                                    setIsAnalyzing(true);
                                    let successCount = 0;
                                    try {
                                        for (const res of processingResults) {
                                            if (res.savedId && res.mappingConfig) {
                                                await api.ingestMappedData(res.savedId, res.mappingConfig);
                                                updateProcessingResult(processingResults.indexOf(res), { status: 'completed' });
                                                successCount++;
                                            }
                                        }
                                        addToast(`Successfully ingested ${successCount} files`, 'success');
                                        // Redirect to Reconciliation page to see results
                                        setTimeout(() => {
                                            window.location.href = '/reconciliation';
                                        }, 1500);
                                    } catch (err) {
                                        console.error(err);
                                        addToast('Failed to ingest some files', 'error');
                                    } finally {
                                        setIsAnalyzing(false);
                                    }
                                }}
                                disabled={isAnalyzing}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm shadow-blue-500/20 flex items-center gap-2"
                            >
                                <Upload size={18} />
                                {isAnalyzing ? 'Ingesting...' : 'Ingest & Reconcile'}
                            </AccessibleButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
