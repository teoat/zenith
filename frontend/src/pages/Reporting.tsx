import { useState } from 'react';
import { LayoutDashboard, TrendingUp, Presentation, FileText } from 'lucide-react';
import SummaryPreview from '../components/reporting/SummaryPreview';
import FinancialHealth from '../components/reporting/FinancialHealth';
import ProjectTracker from '../components/reporting/ProjectTracker';
import ReportBuilder from '../components/reporting/ReportBuilder';

const Reporting = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'financial' | 'project' | 'builder'>('summary');

  const tabs = [
    { id: 'summary', label: 'Summary Preview', icon: LayoutDashboard },
    { id: 'financial', label: 'Financial Health', icon: TrendingUp },
    { id: 'project', label: 'Project Tracker', icon: Presentation },
    { id: 'builder', label: 'Report Builder', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Boardroom & Intelligence</h1>
        
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          {activeTab === 'summary' && <SummaryPreview />}
          {activeTab === 'financial' && <FinancialHealth />}
          {activeTab === 'project' && <ProjectTracker />}
          {activeTab === 'builder' && (
            <div className="p-6">
              <ReportBuilder />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reporting;
