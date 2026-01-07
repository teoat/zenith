import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AccessibleButton } from '@/components/ui/AccessibleButton';

interface ForensicsErrorStateProps {
  error: Error;
  onRetry: () => void;
}

const ForensicsErrorState: React.FC<ForensicsErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="forensics-layout h-full flex flex-col bg-slate-950 text-slate-200">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-400 mb-2">Forensics Unavailable</h2>
          <p className="text-red-300 mb-6">Failed to load evidence: {error.message}</p>
          <AccessibleButton
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
};

export default ForensicsErrorState;