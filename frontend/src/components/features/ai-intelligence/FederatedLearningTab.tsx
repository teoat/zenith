import React from 'react';
import { motion } from 'framer-motion';
import { FederatedNode } from '@/types/ai-intelligence';
import { cn } from '@/lib/utils';

interface FederatedLearningTabProps {
  nodes: FederatedNode[];
}

export const FederatedLearningTab: React.FC<FederatedLearningTabProps> = ({ nodes }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {nodes.map((node) => (
        <div key={node.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm group">
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{node.name}</h4>
            <div className={cn(
               "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase",
               node.status === 'active' ? "bg-green-50 text-green-700 border border-green-100" :
               node.status === 'training' ? "bg-blue-50 text-blue-700 border border-blue-100 animate-pulse" :
               "bg-slate-50 text-slate-500 border border-slate-100"
            )}>
              <div className={cn(
                 "w-1.5 h-1.5 rounded-full",
                 node.status === 'active' ? "bg-green-500" :
                 node.status === 'training' ? "bg-blue-500" : "bg-slate-400"
              )} />
              {node.status}
            </div>
          </div>

          <div className="space-y-4">
            <div>
               <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                  <span>Contribution</span>
                  <span>{(node.contributionScore * 100).toFixed(1)}%</span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${node.contributionScore * 100}%` }} 
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Data Points</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{node.dataPoints.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Sync Status</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{node.lastUpdate}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
};
