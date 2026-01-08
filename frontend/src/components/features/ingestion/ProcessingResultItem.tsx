import React from 'react';
import { FileText, CheckCircle, AlertCircle, Play, X, Database } from 'lucide-react';
import { ProcessingResult } from '@/types/ingestion';
import { ProcessingResultDetails } from './ProcessingResultDetails';
import ProgressBar from '@/components/ui/ProgressBar';
import { AccessibleButton } from '@/components/ui/AccessibleButton';

interface ProcessingResultItemProps {
  result: ProcessingResult;
  index: number;
  onPause: (index: number) => void;
  onResume: (index: number) => void;
  onCancel: (index: number) => void;
}

export const ProcessingResultItem: React.FC<ProcessingResultItemProps> = ({ 
  result, 
  index, 
  onPause, 
  onResume, 
  onCancel 
}) => {
  const getStatusIcon = (status: string, isSaved: boolean = false) => {
    if (isSaved) return <Database size={16} className="text-blue-600" aria-label="Saved to database" />;
    
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" aria-hidden="true" />;
      case 'error': return <AlertCircle size={16} className="text-red-500" aria-hidden="true" />;
      case 'processing': return (
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" aria-hidden="true" />
        );
      case 'paused': return <Play size={16} className="text-blue-400" aria-hidden="true" />;
      case 'cancelled': return <X size={16} className="text-gray-400" aria-hidden="true" />;
      default: return <FileText size={16} className="text-gray-400" aria-hidden="true" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'processing': return 'text-blue-600';
      case 'paused': return 'text-blue-400';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string, isSaved: boolean = false) => {
    if (isSaved) return 'Saved to Evidence';
    switch (status) {
      case 'completed': return 'Processing completed';
      case 'error': return 'Processing failed';
      case 'processing': return 'Processing in progress';
      case 'pending': return 'Waiting to process';
      case 'paused': return 'Processing paused';
      case 'cancelled': return 'Processing cancelled';
      default: return 'Unknown status';
    }
  };

  return (
    <article
      className={`result-item bg-white dark:bg-slate-900 shadow-sm rounded-lg p-4 border ${
        result.isSaved ? 'border-green-500 ring-1 ring-green-100 dark:ring-green-900' : 'border-slate-200 dark:border-slate-800'
      }`}
      aria-labelledby={`result-file-${index}`}
      aria-describedby={`result-status-${index}`}
    >
      <header className="result-header flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(result.status, result.isSaved)}
          <span id={`result-file-${index}`} className="file-name text-lg font-medium text-slate-900 dark:text-white">
            {result.file.name}
          </span>
          <span className="text-slate-500 text-sm ml-2">Queue: #{index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          {result.isSaved && (
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800">
              SAVED
            </span>
          )}
          <span
            id={`result-status-${index}`}
            className={`status-text px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(result.status)}`}
            role="status"
            aria-label={getStatusLabel(result.status, result.isSaved)}
          >
            {result.status}
          </span>
        </div>
      </header>

      <ProgressBar
        progress={result.progress}
        color={
          result.status === 'completed' ? 'success' :
          result.status === 'error' ? 'error' :
          result.status === 'processing' ? 'primary' : 'primary'
        }
        aria-label={`Processing progress for ${result.file.name}: ${result.progress}%`}
        className="mb-3"
      />

      <div className="flex gap-2 mb-3">
        {result.status === 'processing' && (
          <AccessibleButton
            onClick={() => onPause(index)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 text-xs py-1 px-2"
          >
            <Play size={14} className="rotate-180" /> Pause
          </AccessibleButton>
        )}
        {result.status === 'paused' && (
          <AccessibleButton
            onClick={() => onResume(index)}
            className="bg-green-500 hover:bg-green-600 text-white border-0 text-xs py-1 px-2"
          >
            <Play size={14} /> Resume
          </AccessibleButton>
        )}
        {result.isCancellable && result.status !== 'cancelled' && result.status !== 'completed' && (
          <AccessibleButton
            onClick={() => onCancel(index)}
            className="bg-gray-500 hover:bg-gray-600 text-white border-0 text-xs py-1 px-2"
          >
            <X size={14} /> Cancel
          </AccessibleButton>
        )}
      </div>

      {result.error && (
        <div className="error-message flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded-md" role="alert" aria-live="assertive">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{result.error}</span>
        </div>
      )}

      {result.result && <ProcessingResultDetails result={result.result} />}
    </article>
  );
};
