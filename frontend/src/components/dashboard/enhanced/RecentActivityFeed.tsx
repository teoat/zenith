import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const RecentActivityFeed: React.FC = () => {
  const activities = [
    { action: "High-risk transaction flagged", time: "2 minutes ago", type: "alert" },
    { action: "Case #2024-001 resolved", time: "15 minutes ago", type: "success" },
    { action: "New fraud pattern detected", time: "1 hour ago", type: "info" },
    { action: "System health check passed", time: "2 hours ago", type: "success" }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3"
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              activity.type === 'alert' ? 'bg-red-500' :
              activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
            )} />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{activity.action}</p>
              <p className="text-xs text-slate-500">{activity.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
