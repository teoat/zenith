import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Network, Zap, Brain } from 'lucide-react';

export const OverviewTab: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">AI System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20 text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Federated Learning: Operational</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20 text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Real-time Adaptation: Active</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20 text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Multi-modal Processing: Online</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 text-blue-700 dark:text-blue-400">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-bold">Last Model Update: 5 minutes ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Recent AI Activity</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start pb-4 border-b border-slate-50 dark:border-slate-800">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Federated learning round completed</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 font-medium">2 minutes ago</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">12 participants</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 items-start pb-4 border-b border-slate-50 dark:border-slate-800">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg text-yellow-600">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Model adaptation triggered</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 font-medium">8 minutes ago</span>
                  <span className="text-[10px] bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-red-600">High-risk txn pattern</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Multi-modal analysis finalized</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 font-medium">12 minutes ago</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">ENT_2024_001</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
