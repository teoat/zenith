import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, CheckCircle, AlertTriangle } from 'lucide-react';
import { SelfHealingAction } from '@/types/predictive-maintenance';
import { cn } from '@/lib/utils';

interface SelfHealingActionsListProps {
  healingActions: SelfHealingAction[];
}

export const SelfHealingActionsList: React.FC<SelfHealingActionsListProps> = ({
  healingActions
}) => {
  return (
    <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -20 }}
       className="tab-content"
    >
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Self-Healing Actions</h3>
        <p className="text-sm text-slate-600 mb-6">
          Automated recovery actions triggered by AI predictions and system monitoring.
        </p>

        <div className="space-y-4">
          {healingActions.map((action, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="bg-blue-50 p-2 rounded">
                     <Wrench className="w-5 h-5 text-blue-500" />
                   </div>
                   <div>
                     <span className="font-semibold text-slate-900 block capitalize">
                        {action.action_type.replace('_', ' ')}
                     </span>
                     <span className="text-xs text-slate-500 font-mono">
                        {action.action_id}
                     </span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  {action.success ? (
                     <span className="flex items-center text-green-700 bg-green-50 px-2.5 py-1 rounded text-xs font-bold border border-green-100 uppercase">
                       <CheckCircle className="w-3.5 h-3.5 mr-1" /> Successful
                     </span>
                  ) : (
                     <span className="flex items-center text-red-700 bg-red-50 px-2.5 py-1 rounded text-xs font-bold border border-red-100 uppercase">
                       <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Failed
                     </span>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-sm bg-slate-50 p-3 rounded mb-4">
                 <div className="flex flex-col">
                   <span className="text-xs text-slate-500 uppercase">Target Service</span>
                   <span className="font-medium text-slate-900">{action.target_service}</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xs text-slate-500 uppercase">Executed At</span>
                   <span className="font-medium text-slate-900">{new Date(action.execution_time).toLocaleString()}</span>
                 </div>
                  <div className="flex flex-col">
                   <span className="text-xs text-slate-500 uppercase">Rollback Available</span>
                   <span className="font-medium text-slate-900">{action.rollback_available ? 'Yes' : 'No'}</span>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                   <h5 className="font-bold text-slate-700 text-xs uppercase mb-1">Trigger Condition:</h5>
                   <p className="text-slate-600">{action.trigger_condition}</p>
                </div>
                <div>
                   <h5 className="font-bold text-slate-700 text-xs uppercase mb-1">Impact Assessment:</h5>
                   <p className="text-slate-600">{action.impact_assessment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
