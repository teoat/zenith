export interface AIMetrics {
  federatedParticipants: number;
  activeModels: number;
  adaptationEvents: number;
  multimodalAnalyses: number;
  averageConfidence: number;
  modelAccuracy: number;
}

export interface FederatedNode {
  id: string;
  name: string;
  status: 'active' | 'training' | 'syncing' | 'offline';
  lastUpdate: string;
  contributionScore: number;
  dataPoints: number;
}

export interface ModelVersion {
  version: string;
  accuracy: number;
  created: string;
  status: 'active' | 'deprecated' | 'experimental';
  adaptationCount: number;
}

export interface ActivityItem {
  id: string;
  type: 'federated' | 'adaptation' | 'multimodal';
  text: string;
  timestamp: string;
}
