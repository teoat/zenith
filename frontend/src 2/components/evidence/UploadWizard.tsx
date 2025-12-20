import React, { useState, useEffect } from 'react';
import { Upload, FileText, Shield, Hash, CheckCircle, X } from 'lucide-react';
import { AccessibleButton } from '../ui/AccessibleButton';

interface ProcessedFile {
  name: string;
  size: number;
  type: string;
  hash: string;
  status: 'processed' | 'failed';
}

interface UploadWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (files: ProcessedFile[]) => void;
}

type Step = 'ingest' | 'scan' | 'classify' | 'hash' | 'complete';

export const UploadWizard: React.FC<UploadWizardProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const [currentStep, setCurrentStep] = useState<Step>(() => isOpen ? 'ingest' : 'ingest');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep('ingest');
      setUploadedFiles([]);
      setProgress(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (uploadedFiles.length > 0 && currentStep === 'scan') {
      // Simulate scanning process
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setCurrentStep('classify');
            return 0;
          }
          return prev + 10;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [currentStep, uploadedFiles]);

  useEffect(() => {
      if (currentStep === 'classify') {
          // Simulate AI classification
          const interval = setInterval(() => {
            setProgress(prev => {
              if (prev >= 100) {
                clearInterval(interval);
                setCurrentStep('hash');
                return 0;
              }
              return prev + 20;
            });
          }, 400);
          return () => clearInterval(interval);
      }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'hash') {
        // Simulate Hashing
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setCurrentStep('complete');
              return 100;
            }
            return prev + 15;
          });
        }, 200);
        return () => clearInterval(interval);
    }
}, [currentStep]);


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedFiles(Array.from(e.dataTransfer.files));
      setCurrentStep('scan'); // Start process automatically
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setUploadedFiles(Array.from(e.target.files));
        setCurrentStep('scan');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Upload size={20} className="text-blue-500" />
            Evidence Ingestion Wizard
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-200 dark:divide-slate-800">
             {[
                 { id: 'ingest', label: 'Upload', icon: Upload },
                 { id: 'scan', label: 'Virus Scan', icon: Shield },
                 { id: 'classify', label: 'AI Classify', icon: FileText },
                 { id: 'hash', label: 'Crypto Hash', icon: Hash }
             ].map((step) => {
                 const stepIdx = ['ingest', 'scan', 'classify', 'hash', 'complete'].indexOf(step.id);
                 const currentIdx = ['ingest', 'scan', 'classify', 'hash', 'complete'].indexOf(currentStep);
                 const isCompleted = currentIdx > stepIdx;
                 const isCurrent = currentStep === step.id;

                 return (
                     <div key={step.id} className={`p-3 flex items-center justify-center gap-2 text-sm
                        ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : ''}
                        ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}
                     `}>
                         {isCompleted ? <CheckCircle size={16} /> : <step.icon size={16} />}
                         <span className="hidden sm:inline">{step.label}</span>
                     </div>
                 )
             })}
        </div>

        {/* Content Body */}
        <div className="p-8 min-h-[300px] flex flex-col items-center justify-center">
            
            {currentStep === 'ingest' && (
                <div 
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="w-full h-full min-h-[200px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative"
                >
                    <input 
                        type="file" 
                        multiple 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileSelect}
                    />
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4 text-blue-500">
                        <Upload size={32} />
                    </div>
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">Drag and drop files here</p>
                    <p className="text-sm text-slate-500">or click to browse from your computer</p>
                </div>
            )}

            {(currentStep === 'scan' || currentStep === 'classify' || currentStep === 'hash') && (
                <div className="w-full max-w-md text-center">
                    <div className="mb-6 relative h-32 flex items-center justify-center">
                        {/* Animated Step Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                             {currentStep === 'scan' && <Shield size={64} className="text-blue-500 animate-bounce" />}
                             {currentStep === 'classify' && <FileText size={64} className="text-purple-500 animate-pulse" />}
                             {currentStep === 'hash' && <Hash size={64} className="text-green-500 animate-spin-slow" />}
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2 capitalize">
                        {currentStep === 'scan' && 'Scanning for Threats...'}
                        {currentStep === 'classify' && 'AI Classifying Documents...'}
                        {currentStep === 'hash' && 'Generating Immutable Hashes...'}
                    </h3>
                    <p className="text-slate-500 mb-6 text-sm">Processing {uploadedFiles.length} file(s)</p>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-blue-600 h-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {currentStep === 'complete' && (
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Ingestion Complete</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        Successfully processed {uploadedFiles.length} files. 
                        Hashes have been recorded in the chain of custody log.
                    </p>
                    <AccessibleButton 
                        onClick={() => {
                          const processedFiles: ProcessedFile[] = uploadedFiles.map(file => ({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            hash: 'pending', // Would be calculated by backend
                            status: 'processed'
                          }));
                          onUploadComplete(processedFiles);
                          onClose();
                        }} 
                        variant="primary"
                        className="w-full max-w-xs mx-auto"
                    >
                        View in Evidence Lab
                    </AccessibleButton>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            {currentStep === 'ingest' && (
                <AccessibleButton onClick={onClose} variant="secondary">Cancel</AccessibleButton>
            )}
        </div>
      </div>
    </div>
  );
};
