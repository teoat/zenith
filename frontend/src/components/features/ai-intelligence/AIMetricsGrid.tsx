import React from 'react';
import { Network, Brain, Zap, BarChart3 } from 'lucide-react';
import { AIMetrics } from '@/types/ai-intelligence';

interface AIMetricsGridProps {
  metrics: AIMetrics;
}

export const AIMetricsGrid: React.FC<AIMetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-blue-600">
          <Network className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.federatedParticipants}</div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Federated Nodes</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-xl text-purple-600">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.activeModels}</div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Models</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl text-yellow-600">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.adaptationEvents}</div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Adaptations Today</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-green-600">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{(metrics.averageConfidence * 100).toFixed(1)}%</div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Confidence</div>
        </div>
      </div>
    </div>
  );
};
