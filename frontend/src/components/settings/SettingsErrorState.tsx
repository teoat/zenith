import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AccessibleButton } from '../ui/AccessibleButton';

interface SettingsErrorStateProps {
  error: Error;
  onRetry: () => void;
}

const SettingsErrorState: React.FC<SettingsErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="settings-container max-w-4xl mx-auto p-6">
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings Unavailable</h2>
        <p className="text-gray-600 mb-6">
          We encountered an error loading your settings: {error.message}
        </p>
        <AccessibleButton
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </AccessibleButton>
      </div>
    </div>
  );
};

export default SettingsErrorState;