import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardMetric } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface CoreMetricsGridProps {
  metrics: DashboardMetric[];
}

export const CoreMetricsGrid: React.FC<CoreMetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{metric.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
            </div>
            <div className={cn(
              "p-3 rounded-full",
              metric.color.replace('text-', 'bg-').replace('-600', '-100')
            )}>
              <metric.icon className={cn("w-6 h-6", metric.color)} />
            </div>
          </div>
          <div className="flex items-center mt-4">
            {metric.trend === 'up' ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : metric.trend === 'down' ? (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-slate-400" />
            )}
            <span className={cn(
              "text-sm font-medium ml-1",
              metric.trend === 'up' ? 'text-green-600' :
              metric.trend === 'down' ? 'text-red-600' : 'text-slate-600'
            )}>
              {metric.change > 0 ? '+' : ''}{metric.change}%
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
