import React from 'react';
import { CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

interface SuccessBannerProps {
  status: 'success' | 'partial' | 'failed';
  dataQuality: number;
  daysToResolution: number;
  caseId: string;
}

const SuccessBanner: React.FC<SuccessBannerProps> = ({ status, dataQuality, daysToResolution, caseId }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: <CheckCircle className="text-green-600" size={32} />,
          title: 'Case Successfully Resolved',
          textColor: 'text-green-800 dark:text-green-200'
        };
      case 'failed':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: <AlertOctagon className="text-red-600" size={32} />,
          title: 'Case Failed / Unresolved',
          textColor: 'text-red-800 dark:text-red-200'
        };
      case 'partial':
      default:
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: <AlertTriangle className="text-yellow-600" size={32} />,
          title: 'Partial Resolution',
          textColor: 'text-yellow-800 dark:text-yellow-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`p-6 rounded-xl border ${config.bg} ${config.border} flex items-center gap-6`}>
      <div className="flex-shrink-0">
        {config.icon}
      </div>
      
      <div className="flex-1">
        <h2 className={`text-xl font-bold ${config.textColor} mb-1`}>{config.title}</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Case ID: {caseId} • Closed via Standard Protocol</p>
      </div>

      <div className="flex gap-8 border-l border-slate-200 dark:border-slate-700 pl-8">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Data Quality</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {dataQuality}%
            {dataQuality > 90 && <CheckCircle size={14} className="text-green-500" />}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Resolution Time</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {daysToResolution} <span className="text-sm font-normal text-slate-500">days</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessBanner;
