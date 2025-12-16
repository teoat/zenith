// frontend/src/components/ai/AIIntelligenceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Network,
  Zap,
  BarChart3,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';


interface AIMetrics {
  federatedParticipants: number;
  activeModels: number;
  adaptationEvents: number;
  multimodalAnalyses: number;
  averageConfidence: number;
  modelAccuracy: number;
}

interface FederatedNode {
  id: string;
  name: string;
  status: 'active' | 'training' | 'syncing' | 'offline';
  lastUpdate: string;
  contributionScore: number;
  dataPoints: number;
}

interface ModelVersion {
  version: string;
  accuracy: number;
  created: string;
  status: 'active' | 'deprecated' | 'experimental';
  adaptationCount: number;
}

const AIIntelligenceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'federated' | 'adaptation' | 'multimodal'>('overview');
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [federatedNodes, setFederatedNodes] = useState<FederatedNode[]>([]);
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    if (realTimeEnabled) {
      const interval = setInterval(loadDashboardData, 30000); // Update every 30s
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const loadDashboardData = async () => {
    try {
      // Mock data for demonstration - would be replaced with actual API calls
      const metricsData = {
        federatedParticipants: 12,
        activeModels: 3,
        adaptationEvents: 47,
        multimodalAnalyses: 156,
        averageConfidence: 0.89,
        modelAccuracy: 0.94
      };

      const nodesData = [
        {
          id: 'node_001',
          name: 'Desktop Client A',
          status: 'active' as const,
          lastUpdate: '2 min ago',
          contributionScore: 0.95,
          dataPoints: 15420
        },
        {
          id: 'node_002',
          name: 'Web Client B',
          status: 'training' as const,
          lastUpdate: '5 min ago',
          contributionScore: 0.87,
          dataPoints: 12890
        }
      ];

      const modelsData = [
        {
          version: 'v2.1.3',
          accuracy: 0.94,
          created: '2024-01-15T10:30:00Z',
          status: 'active' as const,
          adaptationCount: 23
        },
        {
          version: 'v2.1.2',
          accuracy: 0.91,
          created: '2024-01-10T14:20:00Z',
          status: 'deprecated' as const,
          adaptationCount: 15
        }
      ];

      setMetrics(metricsData);
      setFederatedNodes(nodesData);
      setModelVersions(modelsData);
    } catch (error) {
      console.error('Failed to load AI dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRealTime = () => {
    setRealTimeEnabled(!realTimeEnabled);
  };

  if (loading) {
    return (
      <div className="ai-dashboard-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-slate-600">Loading AI Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="ai-intelligence-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Brain className="w-8 h-8 text-blue-600 mr-3" />
              AI Intelligence Center
            </h1>
            <p className="text-slate-600 mt-1">
              Advanced AI orchestration and federated learning management
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${realTimeEnabled ? 'bg-green-500' : 'bg-slate-400'}`}></div>
              <span className="text-sm text-slate-600">
                {realTimeEnabled ? 'Live' : 'Paused'}
              </span>
            </div>

            <button
              onClick={toggleRealTime}
              className={`p-2 rounded-lg ${
                realTimeEnabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {realTimeEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={loadDashboardData}
              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">
              <Network className="w-6 h-6 text-blue-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.federatedParticipants}</div>
              <div className="metric-label">Federated Nodes</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.activeModels}</div>
              <div className="metric-label">Active Models</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.adaptationEvents}</div>
              <div className="metric-label">Adaptations Today</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div className="metric-content">
              <div className="metric-value">{(metrics.averageConfidence * 100).toFixed(1)}%</div>
              <div className="metric-label">Avg Confidence</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'federated', label: 'Federated Learning', icon: Network },
          { id: 'adaptation', label: 'Real-time Adaptation', icon: Zap },
          { id: 'multimodal', label: 'Multi-modal Analysis', icon: Brain }
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
            {/* AI Health Status */}
            <div className="health-status-card">
              <h3 className="text-lg font-semibold mb-4">AI System Health</h3>
              <div className="health-indicators">
                <div className="indicator">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Federated Learning: Operational</span>
                </div>
                <div className="indicator">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Real-time Adaptation: Active</span>
                </div>
                <div className="indicator">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Multi-modal Processing: Online</span>
                </div>
                <div className="indicator">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Last Model Update: 5 minutes ago</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="activity-feed">
              <h3 className="text-lg font-semibold mb-4">Recent AI Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">
                    <Network className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">Federated learning round completed with 12 participants</p>
                    <p className="activity-time">2 minutes ago</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-icon">
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">Model adaptation triggered for high-risk transaction pattern</p>
                    <p className="activity-time">8 minutes ago</p>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-icon">
                    <Brain className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">Multi-modal analysis completed for entity ENT_2024_001</p>
                    <p className="activity-time">12 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'federated' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
          >
            <div className="federated-nodes-grid">
              {federatedNodes.map((node) => (
                <div key={node.id} className="node-card">
                  <div className="node-header">
                    <div className={`node-status status-${node.status}`}>
                      <div className="status-dot"></div>
                      <span className="status-text">{node.status}</span>
                    </div>
                    <h4 className="node-name">{node.name}</h4>
                  </div>

                  <div className="node-metrics">
                    <div className="metric">
                      <span className="metric-label">Contribution:</span>
                      <span className="metric-value">{(node.contributionScore * 100).toFixed(1)}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Data Points:</span>
                      <span className="metric-value">{node.dataPoints.toLocaleString()}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Last Update:</span>
                      <span className="metric-value">{node.lastUpdate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'adaptation' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
          >
            <div className="model-versions-table">
              <h3 className="text-lg font-semibold mb-4">Model Versions & Adaptations</h3>
              <div className="table-container">
                <table className="model-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Accuracy</th>
                      <th>Status</th>
                      <th>Adaptations</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelVersions.map((model) => (
                      <tr key={model.version}>
                        <td className="font-mono">{model.version}</td>
                        <td>{(model.accuracy * 100).toFixed(1)}%</td>
                        <td>
                          <span className={`status-badge status-${model.status}`}>
                            {model.status}
                          </span>
                        </td>
                        <td>{model.adaptationCount}</td>
                        <td>{new Date(model.created).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'multimodal' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tab-content"
          >
            <div className="multimodal-analysis">
              <h3 className="text-lg font-semibold mb-4">Multi-modal Analysis Dashboard</h3>

              <div className="modality-grid">
                <div className="modality-card">
                  <h4 className="modality-title">Behavioral Biometrics</h4>
                  <div className="modality-metrics">
                    <div className="metric">Anomaly Score: 2.3</div>
                    <div className="metric">Confidence: 87%</div>
                  </div>
                </div>

                <div className="modality-card">
                  <h4 className="modality-title">Social Network</h4>
                  <div className="modality-metrics">
                    <div className="metric">Connections: 15</div>
                    <div className="metric">Risk Score: 0.65</div>
                  </div>
                </div>

                <div className="modality-card">
                  <h4 className="modality-title">Transaction Sequence</h4>
                  <div className="modality-metrics">
                    <div className="metric">Patterns: 8 detected</div>
                    <div className="metric">Velocity: 12 tx/hr</div>
                  </div>
                </div>

                <div className="modality-card">
                  <h4 className="modality-title">Device Fingerprint</h4>
                  <div className="modality-metrics">
                    <div className="metric">Consistency: 92%</div>
                    <div className="metric">Devices: 3</div>
                  </div>
                </div>
              </div>

              <div className="fusion-results">
                <h4 className="text-md font-semibold mb-3">Fusion Analysis</h4>
                <div className="fusion-metrics">
                  <div className="fusion-score">
                    <span className="label">Combined Risk Score:</span>
                    <span className="value">0.78</span>
                    <span className="confidence">(95% confidence)</span>
                  </div>
                  <div className="contributions">
                    <div className="contribution-bar">
                      <div className="bar-label">Behavioral: 25%</div>
                      <div className="bar" style={{width: '25%'}}></div>
                    </div>
                    <div className="contribution-bar">
                      <div className="bar-label">Social: 30%</div>
                      <div className="bar" style={{width: '30%'}}></div>
                    </div>
                    <div className="contribution-bar">
                      <div className="bar-label">Transaction: 20%</div>
                      <div className="bar" style={{width: '20%'}}></div>
                    </div>
                    <div className="contribution-bar">
                      <div className="bar-label">Device: 15%</div>
                      <div className="bar" style={{width: '15%'}}></div>
                    </div>
                    <div className="contribution-bar">
                      <div className="bar-label">Other: 10%</div>
                      <div className="bar" style={{width: '10%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIIntelligenceDashboard;