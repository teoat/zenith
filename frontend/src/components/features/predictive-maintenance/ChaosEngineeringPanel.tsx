import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Network, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { ChaosExperimentResult } from '@/types/predictive-maintenance';
import { Button } from '@/components/ui/Button';

interface ChaosEngineeringPanelProps {
  chaosExperiments: ChaosExperimentResult[];
  onRunExperiment: (type: string) => void;
}

export const ChaosEngineeringPanel: React.FC<ChaosEngineeringPanelProps> = ({
  chaosExperiments,
  onRunExperiment
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Chaos Engineering Experiments</h3>
        <p className="text-sm text-slate-600 mb-6">
          Controlled failure injection to test system resilience and recovery procedures.
        </p>

        {/* Experiment Controls */}
        <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <h4 className="font-medium text-slate-900 mb-4">Run Chaos Experiment</h4>
          <div className="flex flex-wrap gap-3">
             <Button variant="outline" onClick={() => onRunExperiment('cpu_stress')}>
               <Cpu className="w-4 h-4 mr-2" /> CPU Stress
             </Button>
             <Button variant="outline" onClick={() => onRunExperiment('memory_pressure')}>
               <HardDrive className="w-4 h-4 mr-2" /> Memory Pressure
             </Button>
             <Button variant="outline" onClick={() => onRunExperiment('network_partition')}>
               <Network className="w-4 h-4 mr-2" /> Network Partition
             </Button>
             <Button variant="outline" onClick={() => onRunExperiment('service_kill')}>
               <Zap className="w-4 h-4 mr-2" /> Service Kill
             </Button>
          </div>
        </div>

        {/* Experiment Results */}
        <div>
          <h4 className="font-semibold text-slate-900 mb-4">Recent Experiments</h4>
          <div className="space-y-4">
            {chaosExperiments.map((experiment, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded">
                       <Zap className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h5 className="font-mono text-xs text-slate-500">{experiment.experiment_id}</h5>
                      <p className="font-semibold text-slate-900 capitalize">
                        {experiment.experiment_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div>
                    {experiment.failure_injection_success ? (
                      <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        <span className="text-xs font-bold uppercase">Success</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                        <AlertTriangle className="w-4 h-4 mr-1.5" />
                         <span className="text-xs font-bold uppercase">Failed</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4 border-b border-slate-100 pb-4">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs uppercase tracking-wider mb-1">Duration</span>
                    <span className="font-medium text-slate-900">{experiment.duration_seconds}s</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs uppercase tracking-wider mb-1">Stability Score</span>
                    <span className="font-medium text-slate-900">{experiment.system_stability_score.toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-xs uppercase tracking-wider mb-1">Recovery Time</span>
                    <span className="font-medium text-slate-900">{experiment.recovery_time_seconds.toFixed(1)}s</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Affected Services:</h6>
                  <div className="flex flex-wrap gap-2">
                    {experiment.affected_services.map((service, serviceIndex) => (
                      <span key={serviceIndex} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs border border-slate-200">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lessons Learned:</h6>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                    {experiment.lessons_learned.map((lesson, lessonIndex) => (
                      <li key={lessonIndex}>{lesson}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
