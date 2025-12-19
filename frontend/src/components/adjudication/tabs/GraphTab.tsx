import React, { useMemo } from 'react';
import type { AlertItem } from '../../../lib/api';
import ForceGraph2D from 'react-force-graph-2d';

interface GraphTabProps {
  alert: AlertItem;
}

const GraphTab: React.FC<GraphTabProps> = ({ alert: _alert }) => {
  const data = useMemo(() => {
    return {
      nodes: [
        { id: 'Subject', group: 1, val: 20 },
        { id: 'Counterparty', group: 2, val: 15 },
        { id: 'Account', group: 3, val: 10 },
        { id: 'IP', group: 4, val: 8 },
      ],
      links: [
        { source: 'Subject', target: 'Account' },
        { source: 'Account', target: 'Counterparty' },
        { source: 'Subject', target: 'IP' },
      ]
    };
  }, []);

  return (
    <div className="h-full min-h-[400px] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative">
       <div className="absolute top-4 left-4 z-10 bg-slate-900/80 p-2 rounded text-xs text-white backdrop-blur-sm">
         Graph Context
       </div>
       <ForceGraph2D
          width={400} // Parent container width would be better but fixed for now
          height={400}
          graphData={data}
          nodeLabel="id"
          nodeColor={node => {
             const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];
             return colors[(node as any).group - 1] || '#ccc';
          }}
          backgroundColor="#0f172a"
       />
    </div>
  );
};

export default GraphTab;
