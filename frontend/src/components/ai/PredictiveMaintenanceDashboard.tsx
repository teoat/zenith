// frontend/src/components/ai/PredictiveMaintenanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Shield,
  RefreshCw,
  Play,
  StopCircle,
  BarChart3,
  Cpu,
  HardDrive,
  Network,
  Database,
  Wrench,
  Target,
  Timer
} from 'lucide-react';

interface SystemMetrics {
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  disk_io_percent: number;
  network_latency_ms: number;
  active_connections: number;
  queue_depth: number;
  error_rate: number;
  response_time_ms: number;
}

interface FailurePrediction {
  failure_mode: string;
  probability: number;
  time_to_failure_hours: number;
  confidence_score: number;
  contributing_factors: string[];
  recommended_actions: string[];
  predicted_impact: string;
}

interface ChaosExperimentResult {
  experiment_id: string;
  experiment_type: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  system_stability_score: number;
  failure_injection_success: boolean;
  recovery_time_seconds: number;
  affected_services: string[];
  lessons_learned: string[];
}

interface SelfHealingAction {
  action_id: string;
  action_type: string;
  target_service: string;
  trigger_condition: string;
  execution_time: string;
  success: boolean;
  impact_assessment: string;
  rollback_available: boolean;
}

const PredictiveMaintenanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'chaos' | 'healing'>('overview');
  const [systemHealth, setSystemHealth] = useState<number>(85.5);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics | null>(null);
  const [predictions, setPredictions] = useState<FailurePrediction[]>([]);
  const [chaosExperiments, setChaosExperiments] = useState<ChaosExperimentResult[]>([]);
  const [healingActions, setHealingActions] = useState<SelfHealingAction[]>([]);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data - would be replaced with actual API calls
      const mockMetrics: SystemMetrics = {
        timestamp: new Date().toISOString(),
        cpu_percent: 45.2,
        memory_percent: 67.8,
        disk_io_percent: 23.1,
        network_latency_ms: 45.3,
        active_connections: 124,
        queue_depth: 8,
        error_rate: 0.012,
        response_time_ms: 145.6
      };

      const mockPredictions: FailurePrediction[] = [
        {
          failure_mode: "cpu_spike",
          probability: 0.15,
          time_to_failure_hours: 18.5,
          confidence_score: 0.78,
          contributing_factors: ["High concurrent users", "Complex queries"],
          recommended_actions: ["scale_up", "optimize_queries"],
          predicted_impact: "Degraded response times during peak hours"
        },
        {
          failure_mode: "memory_leak",
          probability: 0.08,
          time_to_failure_hours: 72.0,
          confidence_score: 0.65,
          contributing_factors: ["Large dataset processing", "Cache not optimized"],
          recommended_actions: ["clear_cache", "restart_service"],
          predicted_impact: "Potential service restarts under memory pressure"
        }
      ];

      const mockExperiments: ChaosExperimentResult[] = [
        {
          experiment_id: "chaos_cpu_stress_1703123456",
          experiment_type: "cpu_stress",
          start_time: "2025-12-10T14:30:00Z",
          end_time: "2025-12-10T15:00:00Z",
          duration_seconds: 1800,
          system_stability_score: 78.5,
          failure_injection_success: true,
          recovery_time_seconds: 45.2,
          affected_services: ["application_server", "database"],
          lessons_learned: [
            "System handles CPU stress well",
            "Recovery procedures are effective",
            "Auto-scaling triggers appropriately"
          ]
        }
      ];

      const mockHealingActions: SelfHealingAction[] = [
        {
          action_id: "healing_memory_leak_1703123456",
          action_type: "clear_cache",
          target_service: "cache_service",
          trigger_condition: "Predicted memory_leak with 85% probability",
          execution_time: "2025-12-10T12:15:00Z",
          success: true,
          impact_assessment: "Successfully prevented memory exhaustion",
          rollback_available: true
        }
      ];

      setCurrentMetrics(mockMetrics);
      setPredictions(mockPredictions);
      setChaosExperiments(mockExperiments);
      setHealingActions(mockHealingActions);
      setSystemHealth(87.3);

    } catch (error) {
      console.error('Failed to load predictive maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitoring = async () => {
    try {
      if (monitoringActive) {
        // Stop monitoring
        setMonitoringActive(false);
      } else {
        // Start monitoring
        setMonitoringActive(true);
      }
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
    }
  };

  const runChaosExperiment = async (experimentType: string) => {
    try {
      // Simulate running chaos experiment
      console.log(`Running chaos experiment: ${experimentType}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to run chaos experiment:', error);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (health >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.8) return 'text-red-600';
    if (probability >= 0.5) return 'text-orange-600';
    return 'text-yellow-600';
  };

  if (loading) {
    return (
      <div className="predictive-maintenance-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-slate-600">Loading Predictive Maintenance Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="predictive-maintenance-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              Predictive System Maintenance
            </h1>
            <p className="text-slate-600 mt-1">
              AI-driven capacity planning and self-healing infrastructure
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMonitoring}
              className={`px-4 py-2 rounded-lg flex items-center ${
                monitoringActive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {monitoringActive ? (
                <StopCircle className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {monitoringActive ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
            <button
              onClick={loadDashboardData}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="health-overview">
        <div className="health-score-card">
          <div className="score-display">
            <div className="score-value">{systemHealth.toFixed(1)}</div>
            <div className="score-label">System Health</div>
          </div>
          <div className="score-status">
            <span className={`status-badge ${getHealthColor(systemHealth)}`}>
              {systemHealth >= 90 ? 'EXCELLENT' : systemHealth >= 75 ? 'GOOD' : 'NEEDS ATTENTION'}
            </span>
          </div>
        </div>

        {currentMetrics && (
          <div className="metrics-overview">
            <div className="metric-item">
              <Cpu className="w-5 h-5 text-blue-500" />
              <div>
                <div className="metric-value">{currentMetrics.cpu_percent.toFixed(1)}%</div>
                <div className="metric-label">CPU Usage</div>
              </div>
            </div>
            <div className="metric-item">
              <HardDrive className="w-5 h-5 text-green-500" />
              <div>
                <div className="metric-value">{currentMetrics.memory_percent.toFixed(1)}%</div>
                <div className="metric-label">Memory Usage</div>
              </div>
            </div>
            <div className="metric-item">
              <Network className="w-5 h-5 text-purple-500" />
              <div>
                <div className="metric-value">{currentMetrics.network_latency_ms.toFixed(1)}ms</div>
                <div className="metric-label">Network Latency</div>
              </div>
            </div>
            <div className="metric-item">
              <Activity className="w-5 h-5 text-orange-500" />
              <div>
                <div className="metric-value">{currentMetrics.active_connections}</div>
                <div className="metric-label">Active Connections</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'predictions', label: 'Failure Predictions', icon: AlertTriangle },
          { id: 'chaos', label: 'Chaos Engineering', icon: Zap },
          { id: 'healing', label: 'Self-Healing Actions', icon: Wrench }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
          >
            {/* Monitoring Status */}
            <div className="monitoring-status">
              <div className="status-card">
                <div className="status-icon">
                  {monitoringActive ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Clock className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div className="status-content">
                  <h3 className="status-title">Predictive Monitoring</h3>
                  <p className="status-description">
                    {monitoringActive
                      ? 'Active - Continuously analyzing system health and predicting failures'
                      : 'Inactive - Click "Start Monitoring" to begin predictive analysis'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="key-metrics">
              <h3 className="section-title">Key Performance Indicators</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <Target className="w-6 h-6 text-blue-500" />
                    <h4>Error Rate</h4>
                  </div>
                  <div className="metric-value-large">
                    {(currentMetrics?.error_rate || 0 * 100).toFixed(2)}%
                  </div>
                  <div className="metric-trend positive">↓ 0.5%</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <Timer className="w-6 h-6 text-green-500" />
                    <h4>Avg Response Time</h4>
                  </div>
                  <div className="metric-value-large">
                    {currentMetrics?.response_time_ms.toFixed(0)}ms
                  </div>
                  <div className="metric-trend positive">↓ 12ms</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <Database className="w-6 h-6 text-purple-500" />
                    <h4>Queue Depth</h4>
                  </div>
                  <div className="metric-value-large">
                    {currentMetrics?.queue_depth}
                  </div>
                  <div className="metric-trend neutral">→ 0</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <TrendingUp className="w-6 h-6 text-orange-500" />
                    <h4>Predictions Made</h4>
                  </div>
                  <div className="metric-value-large">
                    {predictions.length}
                  </div>
                  <div className="metric-trend neutral">→ 0</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h3 className="section-title">Recent System Activity</h3>
              <div className="activity-timeline">
                <div className="activity-item">
                  <div className="activity-icon">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">Self-healing action completed: Cache cleared successfully</p>
                    <p className="activity-time">5 minutes ago</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-icon">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">Failure prediction: CPU spike possible in 18 hours</p>
                    <p className="activity-time">15 minutes ago</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-icon">
                    <Zap className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">Chaos experiment completed: CPU stress test passed</p>
                    <p className="activity-time">2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'predictions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
          >
            <div className="predictions-section">
              <h3 className="section-title">AI Failure Predictions</h3>
              <p className="section-description">
                Predicted system failures based on current metrics and historical patterns.
              </p>

              <div className="predictions-list">
                {predictions.map((prediction, index) => (
                  <div key={index} className="prediction-card">
                    <div className="prediction-header">
                      <div className="prediction-type">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <span className="prediction-mode">
                          {prediction.failure_mode.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="prediction-probability">
                        <span className={`probability-value ${getProbabilityColor(prediction.probability)}`}>
                          {(prediction.probability * 100).toFixed(0)}%
                        </span>
                        <span className="probability-label">Probability</span>
                      </div>
                    </div>

                    <div className="prediction-details">
                      <div className="prediction-metrics">
                        <div className="metric">
                          <span className="metric-label">Time to Failure:</span>
                          <span className="metric-value">{prediction.time_to_failure_hours.toFixed(1)} hours</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Confidence:</span>
                          <span className="metric-value">{(prediction.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="prediction-impact">
                        <h5 className="impact-title">Predicted Impact:</h5>
                        <p className="impact-description">{prediction.predicted_impact}</p>
                      </div>

                      <div className="prediction-factors">
                        <h5 className="factors-title">Contributing Factors:</h5>
                        <ul className="factors-list">
                          {prediction.contributing_factors.map((factor, factorIndex) => (
                            <li key={factorIndex} className="factor-item">{factor}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="prediction-actions">
                        <h5 className="actions-title">Recommended Actions:</h5>
                        <div className="actions-list">
                          {prediction.recommended_actions.map((action, actionIndex) => (
                            <span key={actionIndex} className="action-tag">
                              {action.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'chaos' && (
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
                    onClick={() => runChaosExperiment('cpu_stress')}
                    className="experiment-button"
                  >
                    <Cpu className="w-4 h-4 mr-2" />
                    CPU Stress Test
                  </button>
                  <button
                    onClick={() => runChaosExperiment('memory_pressure')}
                    className="experiment-button"
                  >
                    <HardDrive className="w-4 h-4 mr-2" />
                    Memory Pressure
                  </button>
                  <button
                    onClick={() => runChaosExperiment('network_partition')}
                    className="experiment-button"
                  >
                    <Network className="w-4 h-4 mr-2" />
                    Network Partition
                  </button>
                  <button
                    onClick={() => runChaosExperiment('service_kill')}
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
        )}

        {activeTab === 'healing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
          >
            <div className="self-healing">
              <h3 className="section-title">Self-Healing Actions</h3>
              <p className="section-description">
                Automated recovery actions triggered by AI predictions and system monitoring.
              </p>

              <div className="healing-actions-list">
                {healingActions.map((action, index) => (
                  <div key={index} className="healing-card">
                    <div className="healing-header">
                      <div className="healing-type">
                        <Wrench className="w-5 h-5 text-blue-500" />
                        <span className="action-type">
                          {action.action_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="healing-status">
                        {action.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="status-text">
                          {action.success ? 'Successful' : 'Failed'}
                        </span>
                      </div>
                    </div>

                    <div className="healing-details">
                      <div className="healing-info">
                        <div className="info-row">
                          <span className="info-label">Target Service:</span>
                          <span className="info-value">{action.target_service}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Executed:</span>
                          <span className="info-value">
                            {new Date(action.execution_time).toLocaleString()}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Rollback Available:</span>
                          <span className="info-value">
                            {action.rollback_available ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      <div className="healing-trigger">
                        <h5 className="trigger-title">Trigger Condition:</h5>
                        <p className="trigger-description">{action.trigger_condition}</p>
                      </div>

                      <div className="healing-impact">
                        <h5 className="impact-title">Impact Assessment:</h5>
                        <p className="impact-description">{action.impact_assessment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PredictiveMaintenanceDashboard;