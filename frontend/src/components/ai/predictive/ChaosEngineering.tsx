import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Network, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ChaosExperimentResult } from '@/components/ai/types/predictive';

interface ChaosEngineeringProps {
  chaosExperiments: ChaosExperimentResult[];
  onRunExperiment: (type: string) => void;
}

export const ChaosEngineering: React.FC<ChaosEngineeringProps> = ({ chaosExperiments, onRunExperiment }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content"
    >
      <div className="chaos-engineering">
        <h3 className="section-title">Chaos Engineering Experiments</h3>
        <p className="section-description">
          Controlled failure injection to test system resilience and recovery procedures.
        </p>

        {/* Experiment Controls */}
        <div className="experiment-controls">
          <h4 className="controls-title">Run Chaos Experiment</h4>
          <div className="experiment-buttons">
            <button
              onClick={() => onRunExperiment('cpu_stress')}
              className="experiment-button"
            >
              <Cpu className="w-4 h-4 mr-2" />
              CPU Stress Test
            </button>
            <button
              onClick={() => onRunExperiment('memory_pressure')}
              className="experiment-button"
            >
              <HardDrive className="w-4 h-4 mr-2" />
              Memory Pressure
            </button>
            <button
              onClick={() => onRunExperiment('network_partition')}
              className="experiment-button"
            >
              <Network className="w-4 h-4 mr-2" />
              Network Partition
            </button>
            <button
              onClick={() => onRunExperiment('service_kill')}
              className="experiment-button"
            >
              <Zap className="w-4 h-4 mr-2" />
              Service Kill
            </button>
          </div>
        </div>

        {/* Experiment Results */}
        <div className="experiment-results">
          <h4 className="results-title">Recent Experiments</h4>
          <div className="experiments-list">
            {chaosExperiments.map((experiment, index) => (
              <div key={index} className="experiment-card">
                <div className="experiment-header">
                  <div className="experiment-info">
                    <h5 className="experiment-id">{experiment.experiment_id}</h5>
                    <p className="experiment-type">
                      {experiment.experiment_type.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  <div className="experiment-status">
                    {experiment.failure_injection_success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="experiment-metrics">
                  <div className="metric-row">
                    <span className="metric-label">Duration:</span>
                    <span className="metric-value">{experiment.duration_seconds}s</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Stability Score:</span>
                    <span className="metric-value">{experiment.system_stability_score.toFixed(1)}%</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Recovery Time:</span>
                    <span className="metric-value">{experiment.recovery_time_seconds.toFixed(1)}s</span>
                  </div>
                </div>

                <div className="experiment-services">
                  <h6 className="services-title">Affected Services:</h6>
                  <div className="services-list">
                    {experiment.affected_services.map((service, serviceIndex) => (
                      <span key={serviceIndex} className="service-tag">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="experiment-lessons">
                  <h6 className="lessons-title">Lessons Learned:</h6>
                  <ul className="lessons-list">
                    {experiment.lessons_learned.map((lesson, lessonIndex) => (
                      <li key={lessonIndex} className="lesson-item">{lesson}</li>
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
