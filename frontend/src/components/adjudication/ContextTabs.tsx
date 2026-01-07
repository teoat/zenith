import React from 'react';
import type { AlertItem } from '@/lib/api';
import ContextTab from './tabs/ContextTab';
import AIReasoningTab from './tabs/AIReasoningTab';
import HistoryTab from './tabs/HistoryTab';
import GraphTab from './tabs/GraphTab';
import { Brain, History, Laptop, FileText } from 'lucide-react';

interface ContextTabsProps {
  alert: AlertItem;
}

const ContextTabs: React.FC<ContextTabsProps> = ({ alert }) => {
  const [activeTab, setActiveTab] = React.useState('context');

  const tabs = [
    { id: 'context', label: 'Context', icon: FileText },
    { id: 'ai', label: 'AI Reasoning', icon: Brain },
    { id: 'history', label: 'History', icon: History },
    { id: 'graph', label: 'Graph', icon: Laptop },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === tab.id 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:dark:text-slate-200'}
            `}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {activeTab === 'context' && <ContextTab alert={alert} />}
        {activeTab === 'ai' && <AIReasoningTab alert={alert} />}
        {activeTab === 'history' && <HistoryTab alert={alert} />}
        {activeTab === 'graph' && <GraphTab alert={alert} />}
      </div>
    </div>
  );
};

export default ContextTabs;
