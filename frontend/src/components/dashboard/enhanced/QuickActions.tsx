import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, BarChart3, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const QuickActions: React.FC = () => {
  const actions = [
    { label: "Start New Investigation", icon: Users, color: "bg-blue-500" },
    { label: "View Active Cases", icon: Target, color: "bg-green-500" },
    { label: "Generate Report", icon: BarChart3, color: "bg-purple-500" },
    { label: "Configure Alerts", icon: AlertTriangle, color: "bg-orange-500" }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={cn("p-2 rounded-lg", action.color)}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-slate-700">{action.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};
