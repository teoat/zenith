import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ShieldAlert, User, DollarSign, Calendar } from 'lucide-react';
import { SanitizedHTML } from '@/hooks/useSanitizedHTML';

interface CasePreviewDrawerProps {
  caseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean; // New prop for embedded mode
}

const CasePreviewDrawer: React.FC<CasePreviewDrawerProps> = ({ caseId, isOpen, onClose, isEmbedded = false }) => {
  // Mock Data Fetch based on ID
  const caseData = caseId ? {
    id: caseId,
    title: 'Structuring Pattern Detected',
    status: 'In Review',
    severity: 'High',
    assignee: 'Agent Smith',
    created: '2023-10-24',
    amount: '$45,200',
    description: 'Multiple deposits under $10,000 threshold within 48 hours.'
  } : null;

  const navigate = useNavigate();

  const handleOpenInvestigation = () => {
    if (caseData?.id) {
       // Navigate to the specific case investigation
       navigate(`/investigation/${caseData.id}`);
    } else {
       navigate('/investigation');
    }
  };

  const contentClass = isEmbedded 
    ? "flex-1 flex flex-col h-full overflow-y-auto p-6"
    : "fixed right-0 top-0 h-full w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-50 animate-in slide-in-from-right duration-300";

  return (
    <>
      {!isEmbedded ? (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-50 animate-in fade-in" />
            <Dialog.Content className={contentClass}>
              {caseData && (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <Dialog.Title className="text-xl font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert className="text-red-500" />
                        CASE-{caseData.id}
                      </Dialog.Title>
                      <Dialog.Description className="text-slate-500 text-sm">
                        Quick Preview
                      </Dialog.Description>
                    </div>
                    <Dialog.Close className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                      <X size={20} />
                    </Dialog.Close>
                  </div>

                  <div className="space-y-6 flex-1 overflow-y-auto">
                    {/* Status Badge */}
                    <div className="flex gap-2">
                      <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        {caseData.status}
                      </span>
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        {caseData.severity} Priority
                      </span>
                    </div>

                    {/* Main Info */}
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{caseData.title}</h3>
                      <SanitizedHTML 
                        html={caseData.description} 
                        className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed"
                      />
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <DollarSign size={14} /> Total Amount
                        </div>
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {caseData.amount}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <User size={14} /> Assignee
                        </div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {caseData.assignee}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Placeholder */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        Recent Activity
                      </h4>
                      <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-700 ml-1">
                        <div className="pl-4 relative">
                          <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                          <p className="text-xs text-slate-500">2 hours ago</p>
                          <p className="text-sm font-medium">Flagged by AI Watchtower</p>
                        </div>
                        <div className="pl-4 relative">
                          <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-300 rounded-full border-2 border-white dark:border-slate-900"></div>
                          <p className="text-xs text-slate-500">Yesterday</p>
                          <p className="text-sm">Transaction ingested</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                    <button onClick={handleOpenInvestigation} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                      Open Investigation
                    </button>
                    <button className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold py-2 px-4 rounded-lg transition-colors">
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : (
        <div className={contentClass}>
          {caseData ? (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="text-red-500" />
                    CASE-{caseData.id}
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Case Details
                  </p>
                </div>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto">
                {/* Status Badge */}
                <div className="flex gap-2">
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {caseData.status}
                  </span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {caseData.severity} Priority
                  </span>
                </div>

                {/* Main Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">{caseData.title}</h3>
                  <SanitizedHTML 
                    html={caseData.description} 
                    className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed"
                  />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <DollarSign size={14} /> Total Amount
                    </div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white">
                      {caseData.amount}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <User size={14} /> Assignee
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {caseData.assignee}
                    </div>
                  </div>
                </div>

                {/* Timeline Placeholder */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    Recent Activity
                  </h4>
                  <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-700 ml-1">
                    <div className="pl-4 relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                      <p className="text-xs text-slate-500">2 hours ago</p>
                      <p className="text-sm font-medium">Flagged by AI Watchtower</p>
                    </div>
                    <div className="pl-4 relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-300 rounded-full border-2 border-white dark:border-slate-900"></div>
                      <p className="text-xs text-slate-500">Yesterday</p>
                      <p className="text-sm">Transaction ingested</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                <button onClick={handleOpenInvestigation} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Open Investigation
                </button>
                <button className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold py-2 px-4 rounded-lg transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
              Select a case to view details
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CasePreviewDrawer;
