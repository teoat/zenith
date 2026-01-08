import React from 'react';
import { motion } from 'framer-motion';
import { ModelVersion } from '@/types/ai-intelligence';
import { cn } from '@/lib/utils';

interface RealTimeAdaptationTabProps {
  modelVersions: ModelVersion[];
}

export const RealTimeAdaptationTab: React.FC<RealTimeAdaptationTabProps> = ({ modelVersions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-slate-50 dark:border-slate-800">
         <h3 className="text-lg font-bold text-slate-900 dark:text-white">Model Adaptation Engine</h3>
         <p className="text-sm text-slate-500">Track dynamic model weights and accuracy shifts</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Version ID</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Model Accuracy</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Operational Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Adaptation Count</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Deployment Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {modelVersions.map((model) => (
              <tr key={model.version} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/80 transition-colors">
                <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600">{model.version}</td>
                <td className="px-6 py-4 font-black">{(model.accuracy * 100).toFixed(1)}%</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-black uppercase",
                    model.status === 'active' ? "bg-green-100 text-green-700" :
                    model.status === 'deprecated' ? "bg-slate-100 text-slate-700" :
                    "bg-blue-100 text-blue-700"
                  )}>
                    {model.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-600">{model.adaptationCount} clusters</td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                   {new Date(model.created).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric'
                   })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
