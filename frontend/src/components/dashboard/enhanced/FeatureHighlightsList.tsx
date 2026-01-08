import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { FeatureHighlight } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface FeatureHighlightsListProps {
  features: FeatureHighlight[];
}

export const FeatureHighlightsList: React.FC<FeatureHighlightsListProps> = ({ features }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <motion.div
          key={feature.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "p-3 rounded-lg",
              feature.status === 'available' ? 'bg-green-100' :
              feature.status === 'beta' ? 'bg-blue-100' : 'bg-slate-100'
            )}>
              <feature.icon className={cn(
                "w-6 h-6",
                feature.status === 'available' ? 'text-green-600' :
                feature.status === 'beta' ? 'text-blue-600' : 'text-slate-600'
              )} />
            </div>
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              feature.status === 'available' ? 'bg-green-100 text-green-700' :
              feature.status === 'beta' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-700'
            )}>
              {feature.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
          <p className="text-slate-600 text-sm mb-4">{feature.description}</p>

          {feature.metrics && (
            <div className="space-y-2 mb-4">
              {feature.metrics.map((metric, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">{metric.label}</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-slate-900">{metric.value}</span>
                    {metric.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {feature.cta && (
            <button
              onClick={feature.cta.action}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {feature.cta.text}
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
};
