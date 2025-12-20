import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  Search,
  Briefcase,
  LayoutDashboard,
  Database,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Cpu,
  Beaker,
  Bell,
  Gavel,
  GitBranch,
  Activity,
  Zap,
  FileCheck,
  Network,
  BookOpen,
  TrendingUp,
  Layers,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: React.ElementType;
  category: 'core' | 'investigation' | 'compliance' | 'system' | 'ai';
  keywords: string[];
}

const quickActions: QuickAction[] = [
  // Core
  { id: 'home', label: 'Adjudication Hub', description: 'Main alert queue', path: '/', icon: Gavel, category: 'core', keywords: ['home', 'alerts', 'adjudication'] },
  { id: 'dashboard', label: 'Intelligence Center', description: 'Dashboard & KPIs', path: '/dashboard', icon: LayoutDashboard, category: 'core', keywords: ['dashboard', 'metrics', 'kpi'] },
  { id: 'cases', label: 'Case Management', description: 'Active investigations', path: '/cases', icon: Briefcase, category: 'core', keywords: ['cases', 'investigations', 'fraud'] },
  { id: 'ingestion', label: 'Data Ingestion', description: 'Upload evidence', path: '/ingestion', icon: Database, category: 'core', keywords: ['upload', 'import', 'data', 'evidence'] },
  { id: 'settings', label: 'Settings', description: 'Application settings', path: '/settings', icon: Settings, category: 'core', keywords: ['settings', 'config', 'preferences'] },

  // Investigation
  { id: 'forensics', label: 'Forensics', description: 'Evidence analysis', path: '/forensics', icon: FileText, category: 'investigation', keywords: ['forensics', 'evidence', 'analysis'] },
  { id: 'network', label: 'Network Analysis', description: 'Visualize connections', path: '/network', icon: BarChart3, category: 'investigation', keywords: ['network', 'graph', 'visualization', 'connections'] },
  { id: 'graph', label: 'Relationship Graph', description: 'Entity relationships', path: '/graph', icon: Network, category: 'investigation', keywords: ['graph', 'relationships', 'entities'] },
  { id: 'investigation', label: 'Investigation Board', description: '3D investigation view', path: '/investigation', icon: Layers, category: 'investigation', keywords: ['investigation', '3d', 'board'] },
  { id: 'notebook', label: 'Investigation Notebook', description: 'Case notes', path: '/notebook', icon: BookOpen, category: 'investigation', keywords: ['notes', 'notebook', 'documentation'] },
  { id: 'reconciliation', label: 'Reconciliation', description: 'Transaction matching', path: '/reconciliation', icon: GitBranch, category: 'investigation', keywords: ['reconciliation', 'matching', 'transactions'] },
  { id: 'evidence-enhanced', label: 'Enhanced Evidence Locker', description: 'Chain of custody', path: '/evidence/enhanced', icon: Shield, category: 'investigation', keywords: ['evidence', 'custody', 'locker'] },

  // Compliance
  { id: 'approvals', label: 'Agent Approvals', description: 'HITL approvals queue', path: '/approvals', icon: FileCheck, category: 'compliance', keywords: ['approvals', 'hitl', 'agent'] },
  { id: 'drafts', label: 'Agent Drafts', description: 'AI recommendations', path: '/drafts', icon: Zap, category: 'compliance', keywords: ['drafts', 'ai', 'recommendations'] },
  { id: 'compliance-monitoring', label: 'Compliance Monitoring', description: 'Real-time compliance', path: '/compliance/monitoring', icon: Activity, category: 'compliance', keywords: ['compliance', 'monitoring', 'alerts'] },
  { id: 'sar-create', label: 'Create SAR', description: 'New SAR filing', path: '/compliance/sar/create', icon: FileText, category: 'compliance', keywords: ['sar', 'filing', 'suspicious'] },
  { id: 'regulatory', label: 'Regulatory Intelligence', description: 'Regulatory updates', path: '/regulatory/intelligence', icon: Bell, category: 'compliance', keywords: ['regulatory', 'updates', 'intelligence'] },
  { id: 'advanced-compliance', label: 'Advanced Compliance', description: 'Compliance dashboard', path: '/advanced-compliance', icon: Shield, category: 'compliance', keywords: ['advanced', 'compliance', 'rules'] },
  { id: 'reporting', label: 'Reporting', description: 'Generate reports', path: '/reporting', icon: TrendingUp, category: 'compliance', keywords: ['reports', 'reporting', 'analytics'] },

  // System
  { id: 'performance', label: 'Performance Dashboard', description: 'System metrics', path: '/performance', icon: Cpu, category: 'system', keywords: ['performance', 'metrics', 'cpu', 'memory'] },
  { id: 'diagnostics', label: 'System Diagnostics', description: 'Health checks', path: '/diagnostics/system', icon: Activity, category: 'system', keywords: ['diagnostics', 'health', 'system'] },
  { id: 'orchestration', label: 'System Orchestration', description: 'Overall system score', path: '/orchestration', icon: Layers, category: 'system', keywords: ['orchestration', 'score', 'dimensions'] },
  { id: 'predictive', label: 'Predictive Maintenance', description: 'Failure prediction', path: '/predictive-maintenance', icon: Zap, category: 'system', keywords: ['predictive', 'maintenance', 'failure'] },

  // AI
  { id: 'ai-lab', label: 'AI Lab', description: 'ML experiments', path: '/ai-lab', icon: Beaker, category: 'ai', keywords: ['ai', 'lab', 'experiments', 'ml'] },
  { id: 'code-review', label: 'Code Review', description: 'AI code analysis', path: '/code-review', icon: GitBranch, category: 'ai', keywords: ['code', 'review', 'analysis'] },
];

const categoryLabels: Record<string, string> = {
  core: 'Core',
  investigation: 'Investigation',
  compliance: 'Compliance',
  system: 'System',
  ai: 'AI & Labs'
};

const categoryColors: Record<string, string> = {
  core: 'text-blue-500',
  investigation: 'text-purple-500',
  compliance: 'text-amber-500',
  system: 'text-emerald-500',
  ai: 'text-pink-500'
};

interface QuickActionsMenuProps {
  className?: string;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter actions based on search
  const filteredActions = search
    ? quickActions.filter(action =>
        action.label.toLowerCase().includes(search.toLowerCase()) ||
        action.description.toLowerCase().includes(search.toLowerCase()) ||
        action.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()))
      )
    : quickActions;

  // Group by category
  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) acc[action.category] = [];
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  // Keyboard shortcut to open (Cmd+K or Ctrl+K)
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Focus input and reset state when opened
  useEffect(() => {
    if (isOpen) {
      // Focus with a microtask to ensure DOM is ready
      queueMicrotask(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Reset search and selection when menu opens
  const handleOpen = () => {
    setSearch('');
    setSelectedIndex(0);
    setIsOpen(true);
  };

  // Navigation within menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredActions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredActions[selectedIndex]) {
      e.preventDefault();
      navigate(filteredActions[selectedIndex].path);
      setIsOpen(false);
    }
  };

  const handleSelect = (action: QuickAction) => {
    navigate(action.path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors",
          className
        )}
        aria-label="Quick actions menu"
      >
        <Command className="h-4 w-4" />
        <span className="hidden sm:inline">Quick Actions</span>
        <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-xs bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
          ⌘K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
            >
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Search Header */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSelectedIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search pages, features, actions..."
                    className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-base"
                  />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                    aria-label="Close quick actions"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                  {Object.entries(groupedActions).map(([category, actions]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      <div className={cn("px-3 py-1.5 text-xs font-semibold uppercase tracking-wider", categoryColors[category])}>
                        {categoryLabels[category]}
                      </div>
                      {actions.map((action) => {
                        const globalIndex = filteredActions.indexOf(action);
                        const isSelected = globalIndex === selectedIndex;
                        const Icon = action.icon;

                        return (
                          <button
                            key={action.id}
                            onClick={() => handleSelect(action)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                              isSelected
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg",
                              isSelected ? "bg-blue-100 dark:bg-blue-900/50" : "bg-slate-100 dark:bg-slate-800"
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{action.label}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {action.description}
                              </div>
                            </div>
                            {isSelected && (
                              <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded">
                                Enter
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}

                  {filteredActions.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No results for "{search}"</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded">↑</kbd>
                    <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded">↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded">Enter</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded">Esc</kbd>
                    Close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickActionsMenu;
