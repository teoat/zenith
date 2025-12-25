// frontend/src/components/ui/AIInsights.tsx
// React import removed
import { useState, useEffect } from 'react';
import { Brain, AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { aiFraudDetector } from '../../lib/AIFraudDetection';
import { secureLogger } from '../../utils/secureLogger';
// api import removed as unused

interface TransactionData {
  id: string;
  amount: number;
  merchant: string;
  timestamp: string;
  category: string;
  location?: string;
}

interface AIInsightsProps {
  transaction?: TransactionData;
  className?: string;
}

export function AIInsights({ transaction, className = '' }: AIInsightsProps) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      analyzeTransaction(transaction);
    }
  }, [transaction]);

  const analyzeTransaction = async (tx: TransactionData) => {
    try {
      setLoading(true);
      setError(null);

      // Convert transaction to AI features
      const features = {
        amount: tx.amount,
        frequency: 1, // Simplified - would need historical data
        timeOfDay: new Date(tx.timestamp).getHours(),
        dayOfWeek: new Date(tx.timestamp).getDay(),
        location: tx.location || 'unknown',
        merchantCategory: tx.category,
        previousTransactions: [tx.amount * 0.8, tx.amount * 0.9], // Simplified
        userHistory: {
          totalTransactions: 50, // Would come from user data
          averageAmount: 200, // Would come from user data
          riskScore: 0.1 // Would come from user data
        }
      };

      const result = await aiFraudDetector.analyzeTransaction(features);
      setInsights(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 0.7) return 'text-red-600 bg-red-50 border-red-200';
    if (score > 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskIcon = (score: number) => {
    if (score > 0.7) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (score > 0.4) return <TrendingUp className="w-5 h-5 text-yellow-600" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  if (loading) {
    return (
      <div className={`ai-insights loading ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
          <h3 className="text-lg font-semibold">AI Analysis</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`ai-insights error ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold">AI Analysis Error</h3>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className={`ai-insights empty ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-semibold">AI Analysis</h3>
        </div>
        <p className="text-gray-500">Select a transaction to analyze</p>
      </div>
    );
  }

  return (
    <div className={`ai-insights ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">AI Fraud Analysis</h3>
      </div>

      {/* Risk Score */}
      <div className={`risk-score-card ${getRiskColor(insights.riskScore)} border rounded-lg p-4 mb-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Risk Score</span>
          {getRiskIcon(insights.riskScore)}
        </div>
        <div className="text-2xl font-bold">
          {(insights.riskScore * 100).toFixed(1)}%
        </div>
        <div className="text-sm opacity-75">
          Confidence: {(insights.confidence * 100).toFixed(1)}%
        </div>
      </div>

      {/* Risk Factors */}
      {insights.factors.length > 0 && (
        <div className="risk-factors mb-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Risk Factors
          </h4>
          <ul className="space-y-1">
            {insights.factors.map((factor: string, index: number) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="recommendations">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Recommendations
          </h4>
          <ul className="space-y-1">
            {insights.recommendations.map((rec: string, index: number) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Model Details */}
      <div className="model-details mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div>Anomaly Score: {(insights.anomalyScore * 100).toFixed(1)}%</div>
          <div>Analysis Time: &lt; 1s</div>
        </div>
      </div>
    </div>
  );
}

// AI Model Performance Dashboard
export function AIModelPerformance() {
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const perf = await aiFraudDetector.getModelPerformance();
      setPerformance(perf);
     } catch (error) { 
      secureLogger.error('Failed to load AI performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading AI performance...</div>;
  }

  if (!performance) {
    return <div className="text-center py-4 text-gray-500">No performance data available</div>;
  }

  return (
    <div className="ai-performance grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="glass-card p-4">
        <div className="text-2xl font-bold text-blue-600">
          {(performance.accuracy * 100).toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600">Accuracy</div>
      </div>

      <div className="glass-card p-4">
        <div className="text-2xl font-bold text-green-600">
          {(performance.precision * 100).toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600">Precision</div>
      </div>

      <div className="glass-card p-4">
        <div className="text-2xl font-bold text-purple-600">
          {(performance.recall * 100).toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600">Recall</div>
      </div>

      <div className="glass-card p-4 md:col-span-3">
        <div className="text-xl font-bold text-indigo-600">
          {(performance.f1Score * 100).toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600">F1 Score</div>
      </div>
    </div>
  );
}