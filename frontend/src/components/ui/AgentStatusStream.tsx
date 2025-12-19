import React, { useEffect, useState } from 'react';
import { Activity, Database, Globe, ShieldCheck } from 'lucide-react';
// import { secureRandom } from '../../utils/secureRandom'; // Module not found

interface AgentStatus {
  id: string;
  agentName: string;
  status: 'idle' | 'busy' | 'searching' | 'analyzing' | 'complete';
  message: string;
  icon: React.ReactNode;
}

export const AgentStatusStream: React.FC = () => {
  const [agents, setAgents] = useState<AgentStatus[]>([
    { id: '1', agentName: 'Search Bot', status: 'idle', message: 'Waiting for queries...', icon: <Globe size={14} /> },
    { id: '2', agentName: 'Fraud Analyst', status: 'idle', message: 'Monitoring transactions...', icon: <ShieldCheck size={14} /> },
    { id: '3', agentName: 'Risk Scorer', status: 'idle', message: 'Ready to score evidence...', icon: <Database size={14} /> },
  ]);

  // Simulate some background activity
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => {
        const randomIndex = Math.floor((window.crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF) * prev.length);
        const newAgents = [...prev];
        const statuses: ('idle' | 'busy' | 'searching' | 'analyzing')[] = ['idle', 'busy', 'searching', 'analyzing'];
        const messages = {
          idle: 'Awaiting instructions...',
          busy: 'Processing request...',
          searching: 'Crawling global databases...',
          analyzing: 'Extracting pattern vectors...'
        };
        
        const newStatus = statuses[Math.floor((window.crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF) * statuses.length)];
        newAgents[randomIndex] = {
          ...newAgents[randomIndex],
          status: newStatus,
          message: messages[newStatus]
        };
        return newAgents;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Activity size={12} className="text-blue-500" />
          Autonomous Agent Fleet
        </h4>
        <span className="text-[10px] text-green-500 font-medium animate-pulse">Live</span>
      </div>
      
      <div className="space-y-2">
        {agents.map(agent => (
          <div key={agent.id} className="flex items-start gap-3">
            <div className={`mt-0.5 p-1 rounded bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 ${agent.status !== 'idle' ? 'text-blue-500' : 'text-slate-400'}`}>
              {agent.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{agent.agentName}</span>
                <span className={`text-[9px] px-1 rounded-full ${
                  agent.status === 'idle' ? 'bg-slate-100 text-slate-500' : 
                  agent.status === 'busy' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {agent.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{agent.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentStatusStream;
