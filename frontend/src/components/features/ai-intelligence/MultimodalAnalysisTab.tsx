import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, Repeat, Smartphone } from 'lucide-react';

export const MultimodalAnalysisTab: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
           <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Behavioral Biometrics</h4>
           </div>
           <div className="space-y-2">
              <div className="flex justify-between text-xs">
                 <span className="text-slate-500">Anomaly Score</span>
                 <span className="font-bold text-red-600">2.3 / 10</span>
              </div>
              <div className="flex justify-between text-xs">
                 <span className="text-slate-500">Confidence</span>
                 <span className="font-bold text-slate-900 dark:text-white">87%</span>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
           <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Social Network</h4>
           </div>
           <div className="space-y-2">
              <div className="flex justify-between text-xs">
                 <span className="text-slate-500">Connections</span>
                 <span className="font-bold text-slate-900 dark:text-white">15 nodes</span>
              </div>
              <div className="flex justify-between text-xs">
                 <span className="text-slate-500">Risk Score</span>
                 <span className="font-bold text-yellow-600">0.65</span>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
           <div className="flex items-center gap-3">
              <Repeat className="w-5 h-5 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Transaction Sequence</h4>
           </div>
           <div className="space-y-2">
              <div className="flex justify-between text-xs">
                 <span className="text-slate-500">Pattern Count</span>
                 <span className="font-bold text-slate-900 dark:text-white">8 detected</span>
              </div>
              <div className="flex justify-between text-xs">
                 <span className="text-slate-500">Velocity</span>
                 <span className="font-bold text-slate-900 dark:text-white">12 tx/hr</span>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
           <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-indigo-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Device Fingerprint</h4>
           </div>
           <div className="space-y-2">
              <div className="flex justify-between text-xs">
                 <span className="text-slate-500">Consistency</span>
                 <span className="font-bold text-green-600">92%</span>
              </div>
              <div className="flex justify-between text-xs">
                 <span className="text-slate-500">Device Count</span>
                 <span className="font-bold text-slate-900 dark:text-white">3 active</span>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-12 items-center">
           <div className="flex-1 space-y-6">
              <div>
                 <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Signal Fusion Analysis</h4>
                 <p className="text-slate-500 text-sm">Combined weighted metrics for objective risk determination</p>
              </div>
              
              <div className="space-y-4">
                 {[
                   { label: 'Behavioral', weight: 25, color: 'bg-blue-600' },
                   { label: 'Social Network', weight: 30, color: 'bg-purple-600' },
                   { label: 'Transactions', weight: 20, color: 'bg-emerald-600' },
                   { label: 'Device ID', weight: 15, color: 'bg-indigo-600' },
                   { label: 'Other Signals', weight: 10, color: 'bg-slate-400' }
                 ].map(item => (
                   <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] uppercase font-black text-slate-400">
                         <span>{item.label}</span>
                         <span>{item.weight}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.weight}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="w-full md:w-[320px] bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center space-y-4">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Combined Risk Score</div>
              <div className="text-6xl font-black text-slate-900 dark:text-white">0.78</div>
              <div className="bg-blue-600 text-white text-[10px] font-black py-1 px-3 rounded-full inline-block">
                 95% CONFIDENCE
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-4">
                 System highly recommends manual review for this entity based on social-behavioral correlation.
              </p>
           </div>
        </div>
      </div>
    </motion.div>
  );
};
