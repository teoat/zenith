import React from 'react';
import { GraphStats } from '@/types/graph';

interface GraphStatsFooterProps {
  stats: GraphStats;
}

export const GraphStatsFooter: React.FC<GraphStatsFooterProps> = ({ stats }) => {
  return (
    <div className="border-t border-slate-200 dark:border-slate-700 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.node_count || 0}</div>
        <div className="text-xs uppercase tracking-wider text-slate-500">Nodes</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.edge_count || 0}</div>
        <div className="text-xs uppercase tracking-wider text-slate-500">Edges</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {stats.connected_components || 0}
        </div>
        <div className="text-xs uppercase tracking-wider text-slate-500">Components</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {(stats.density || 0).toFixed(3)}
        </div>
        <div className="text-xs uppercase tracking-wider text-slate-500">Density</div>
      </div>
    </div>
  );
};
