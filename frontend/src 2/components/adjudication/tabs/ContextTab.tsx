import React from 'react';
import { AlertItem } from '../../../lib/api';
import { useFormatters } from '../../../providers/LocaleProvider';
import { Building2, DollarSign, MapPin } from 'lucide-react';

interface ContextTabProps {
  alert: AlertItem;
}

const ContextTab: React.FC<ContextTabProps> = ({ alert }) => {
  const { formatCurrency, formatDate } = useFormatters();

  return (
    <div className="space-y-6">
      {/* Primary Entity Card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Primary Entity</h3>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400">
            <Building2 size={24} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Acme Corporation Ltd.</h4>
            <div className="text-sm text-slate-500 mt-1 flex flex-col gap-1">
               <span className="flex items-center gap-1"><MapPin size={12} /> 123 Business Park, Enterprise City</span>
               <span className="flex items-center gap-1">ID: {alert.caseId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Transaction Context</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-slate-500">Amount</dt>
            <dd className="text-lg font-mono font-medium text-slate-900 dark:text-white flex items-center">
               <DollarSign size={14} className="text-slate-400 mr-1" />
               {/* Mock amount as it's not in base interface yet */}
               {formatCurrency(125000)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Date</dt>
            <dd className="text-sm font-medium text-slate-900 dark:text-white">
                {formatDate(alert.createdAt)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-slate-500">Description</dt>
            <dd className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                {alert.description}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default ContextTab;
