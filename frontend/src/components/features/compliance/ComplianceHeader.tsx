import React from 'react';
import { Shield, Play, StopCircle, RefreshCw } from 'lucide-react';

interface ComplianceHeaderProps {
  monitoringActive: boolean;
  onToggleMonitoring: () => void;
  onRefresh: () => void;
}

export const ComplianceHeader: React.FC<ComplianceHeaderProps> = ({
  monitoringActive,
  onToggleMonitoring,
  onRefresh
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            Advanced Compliance Technology
          </h1>
          <p className="text-slate-600 mt-1">
            Real-time regulatory monitoring and automated compliance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMonitoring}
            className={`px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors ${
              monitoringActive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {monitoringActive ? (
              <StopCircle className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {monitoringActive ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
          <button
            onClick={onRefresh}
            className="bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 border border-slate-200 flex items-center shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
