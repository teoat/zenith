/**
 * PredictiveDashboard - Phase 6G Advanced Intelligence
 * ML-based fraud prediction and risk forecasting dashboard
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
// Tabs available but not currently used
// import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { secureRandom } from '../../utils/secureRandom'; // Module not found
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Activity,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Eye,
  RefreshCw
} from 'lucide-react';
import './PredictiveDashboard.css';

// Types
interface Prediction {
  id: string;
  entityId: string;
  entityName: string;
  entityType: 'account' | 'entity' | 'network' | 'transaction';
  riskScore: number;
  riskTrend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
  factors: PredictionFactor[];
  predictedPatterns: string[];
  timeHorizon: '24h' | '7d' | '30d';
}

interface PredictionFactor {
  name: string;
  weight: number;
  direction: 'positive' | 'negative';
  description: string;
}

interface RiskTrend {
  date: Date;
  riskScore: number;
  anomalyScore: number;
  transactionVolume: number;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  lastTrained: Date;
}

interface PredictiveDashboardProps {
  predictions?: Prediction[];
  trendData?: RiskTrend[];
  modelMetrics?: ModelMetrics;
  onPredictionClick?: (prediction: Prediction) => void;
  onRefresh?: () => void;
}

// Mock data generators
const generateMockPredictions = (): Prediction[] => [
  {
    id: 'pred1',
    entityId: 'acc-001',
    entityName: 'Suspicious Account #4521',
    entityType: 'account',
    riskScore: 92,
    riskTrend: 'increasing',
    confidence: 88,
    factors: [
      { name: 'Transaction Velocity', weight: 0.35, direction: 'negative', description: '340% increase in last 24h' },
      { name: 'Geographic Dispersion', weight: 0.25, direction: 'negative', description: 'Transactions from 12 countries' },
      { name: 'Structuring Pattern', weight: 0.20, direction: 'negative', description: 'Multiple sub-10k transactions' },
      { name: 'Network Risk', weight: 0.20, direction: 'negative', description: 'Connected to 3 flagged entities' }
    ],
    predictedPatterns: ['Money Mule', 'Layering', 'Smurfing'],
    timeHorizon: '24h'
  },
  {
    id: 'pred2',
    entityId: 'net-002',
    entityName: 'Shell Company Network Alpha',
    entityType: 'network',
    riskScore: 85,
    riskTrend: 'stable',
    confidence: 82,
    factors: [
      { name: 'Circular Transactions', weight: 0.40, direction: 'negative', description: 'Round-trip flows detected' },
      { name: 'Dormancy Pattern', weight: 0.30, direction: 'negative', description: 'Sudden reactivation' },
      { name: 'Ownership Opacity', weight: 0.30, direction: 'negative', description: 'Nominee directors only' }
    ],
    predictedPatterns: ['Trade-Based ML', 'Shell Network'],
    timeHorizon: '7d'
  },
  {
    id: 'pred3',
    entityId: 'ent-003',
    entityName: 'Global Trading LLC',
    entityType: 'entity',
    riskScore: 68,
    riskTrend: 'decreasing',
    confidence: 75,
    factors: [
      { name: 'Invoice Anomalies', weight: 0.45, direction: 'negative', description: 'Price discrepancies detected' },
      { name: 'Counterparty Risk', weight: 0.35, direction: 'negative', description: 'High-risk jurisdiction' },
      { name: 'Historical Compliance', weight: 0.20, direction: 'positive', description: 'Good SAR history' }
    ],
    predictedPatterns: ['Trade Mispricing'],
    timeHorizon: '30d'
  }
];

const generateMockTrends = (): RiskTrend[] => {
  const trends: RiskTrend[] = [];
  const baseDate = Date.now() - 30 * 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < 30; i++) {
    trends.push({
      date: new Date(baseDate + i * 24 * 60 * 60 * 1000),
      riskScore: 45 + secureRandom.random() * 30 + (i > 20 ? 15 : 0),
      anomalyScore: 20 + secureRandom.random() * 40,
      transactionVolume: 1000000 + secureRandom.random() * 500000
    });
  }
  
  return trends;
};

// Risk Score Ring Component
const RiskScoreRing: React.FC<{
  score: number;
  size?: number;
  label?: string;
}> = ({ score, size = 100, label }) => {
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;
  
  const getColor = (s: number) => {
    if (s >= 80) return '#ef4444';
    if (s >= 60) return '#f59e0b';
    if (s >= 40) return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="risk-score-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(100, 116, 139, 0.2)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={getColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="ring-content">
        <span className="ring-value" style={{ color: getColor(score) }}>{score}</span>
        {label && <span className="ring-label">{label}</span>}
      </div>
    </div>
  );
};

// MiniTrendChart component - available for future use
// const MiniTrendChart: React.FC<{
//   data: number[];
//   color: string;
//   height?: number;
// }> = ({ data, color, height = 40 }) => { ... };

// Prediction Card Component
const PredictionCard: React.FC<{
  prediction: Prediction;
  onClick: () => void;
}> = ({ prediction, onClick }) => {
  const getTrendIcon = (trend: Prediction['riskTrend']) => {
    switch (trend) {
      case 'increasing': return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'decreasing': return <ArrowDownRight className="w-4 h-4 text-green-400" />;
      default: return <Activity className="w-4 h-4 text-amber-400" />;
    }
  };

  const getEntityIcon = (type: Prediction['entityType']) => {
    switch (type) {
      case 'account': return <Target className="w-4 h-4" />;
      case 'network': return <Activity className="w-4 h-4" />;
      case 'entity': return <Shield className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div
      className="prediction-card"
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
    >
      <div className="prediction-header">
        <div className="entity-info">
          <div className="entity-icon">{getEntityIcon(prediction.entityType)}</div>
          <div>
            <h4 className="entity-name">{prediction.entityName}</h4>
            <span className="entity-type">{prediction.entityType}</span>
          </div>
        </div>
        <RiskScoreRing score={prediction.riskScore} size={60} />
      </div>

      <div className="prediction-factors">
        {prediction.factors.slice(0, 3).map((factor, idx) => (
          <div key={idx} className="factor-item">
            <div className="factor-header">
              <span className="factor-name">{factor.name}</span>
              <Badge variant={factor.direction === 'negative' ? 'destructive' : 'default'} className="factor-weight">
                {(factor.weight * 100).toFixed(0)}%
              </Badge>
            </div>
            <Progress value={factor.weight * 100} className="factor-progress" />
            <span className="factor-description">{factor.description}</span>
          </div>
        ))}
      </div>

      <div className="prediction-footer">
        <div className="trend-indicator">
          {getTrendIcon(prediction.riskTrend)}
          <span>{prediction.riskTrend}</span>
        </div>
        <div className="predicted-patterns">
          {prediction.predictedPatterns.map((pattern, idx) => (
            <Badge key={idx} variant="outline" className="pattern-badge">{pattern}</Badge>
          ))}
        </div>
        <div className="confidence-badge">
          <Eye className="w-3 h-3" />
          <span>{prediction.confidence}% confidence</span>
        </div>
      </div>
    </div>
  );
};

export const PredictiveDashboard: React.FC<PredictiveDashboardProps> = ({
  predictions: propPredictions,
  trendData: propTrendData,
  modelMetrics: propModelMetrics,
  onPredictionClick,
  onRefresh
}) => {
  const predictions = propPredictions || generateMockPredictions();
  // trendData reserved for future chart visualization
  void (propTrendData || generateMockTrends());
  const modelMetrics: ModelMetrics = propModelMetrics || {
    accuracy: 94.2,
    precision: 91.8,
    recall: 89.5,
    f1Score: 90.6,
    auc: 0.967,
    lastTrained: new Date('2024-12-10')
  };

  const [timeHorizon, setTimeHorizon] = useState<'24h' | '7d' | '30d'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Aggregate statistics
  const stats = useMemo(() => {
    const highRisk = predictions.filter(p => p.riskScore >= 80).length;
    const increasing = predictions.filter(p => p.riskTrend === 'increasing').length;
    const avgConfidence = Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length);
    const avgRisk = Math.round(predictions.reduce((s, p) => s + p.riskScore, 0) / predictions.length);
    
    return { highRisk, increasing, avgConfidence, avgRisk, total: predictions.length };
  }, [predictions]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    onRefresh?.();
    await new Promise(r => setTimeout(r, 1500));
    setIsRefreshing(false);
  }, [onRefresh]);

  return (
    <Card className="predictive-dashboard-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="dashboard-icon">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Predictive Intelligence</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                ML-powered fraud prediction & risk forecasting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeHorizon} onValueChange={(v) => setTimeHorizon(v as typeof timeHorizon)}>
              <SelectTrigger className="w-28">
                <Clock className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="stats-grid">
          <div className="stat-card risk">
            <RiskScoreRing score={stats.avgRisk} size={80} label="Avg Risk" />
            <div className="stat-details">
              <span className="stat-title">Average Risk Score</span>
              <span className="stat-description">Across {stats.total} monitored entities</span>
            </div>
          </div>
          
          <div className="stat-card alerts">
            <div className="stat-icon-large">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <span className="stat-number">{stats.highRisk}</span>
            </div>
            <div className="stat-details">
              <span className="stat-title">High-Risk Alerts</span>
              <span className="stat-description">Require immediate attention</span>
            </div>
          </div>

          <div className="stat-card trending">
            <div className="stat-icon-large">
              <TrendingUp className="w-8 h-8 text-amber-400" />
              <span className="stat-number">{stats.increasing}</span>
            </div>
            <div className="stat-details">
              <span className="stat-title">Rising Risks</span>
              <span className="stat-description">Trend increasing</span>
            </div>
          </div>

          <div className="stat-card confidence">
            <div className="stat-icon-large">
              <Target className="w-8 h-8 text-blue-400" />
              <span className="stat-number">{stats.avgConfidence}%</span>
            </div>
            <div className="stat-details">
              <span className="stat-title">Avg Confidence</span>
              <span className="stat-description">Model certainty</span>
            </div>
          </div>
        </div>

        {/* Model Performance */}
        <div className="model-metrics">
          <div className="metrics-header">
            <Brain className="w-4 h-4" />
            <span>Model Performance</span>
            <Badge variant="outline" className="ml-auto">
              Last trained: {modelMetrics.lastTrained.toLocaleDateString()}
            </Badge>
          </div>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Accuracy</span>
              <span className="metric-value">{modelMetrics.accuracy}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Precision</span>
              <span className="metric-value">{modelMetrics.precision}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Recall</span>
              <span className="metric-value">{modelMetrics.recall}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">F1 Score</span>
              <span className="metric-value">{modelMetrics.f1Score}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">AUC-ROC</span>
              <span className="metric-value">{modelMetrics.auc.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Predictions List */}
        <div className="predictions-section">
          <div className="section-header">
            <Zap className="w-4 h-4" />
            <span>Active Predictions</span>
            <Badge variant="destructive">{stats.highRisk} critical</Badge>
          </div>
          <div className="predictions-grid">
            {predictions
              .filter(p => timeHorizon === '24h' ? p.timeHorizon === '24h' : 
                           timeHorizon === '7d' ? ['24h', '7d'].includes(p.timeHorizon) : true)
              .sort((a, b) => b.riskScore - a.riskScore)
              .map(prediction => (
                <PredictionCard
                  key={prediction.id}
                  prediction={prediction}
                  onClick={() => onPredictionClick?.(prediction)}
                />
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictiveDashboard;
