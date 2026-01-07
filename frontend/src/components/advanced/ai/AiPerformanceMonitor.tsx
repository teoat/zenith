import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ModelMetrics {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  latency: number;
  throughput: number;
  last_updated: string;
  status: 'healthy' | 'warning' | 'critical';
}

const AiPerformanceMonitor: React.FC = () => {
  const [metrics] = useState<ModelMetrics[]>([
    {
      name: 'Fraud Detection Model',
      accuracy: 0.94,
      precision: 0.91,
      recall: 0.87,
      f1_score: 0.89,
      latency: 45,
      throughput: 1250,
      last_updated: '2025-12-19T12:00:00Z',
      status: 'healthy'
    },
    {
      name: 'Risk Scoring Engine',
      accuracy: 0.89,
      precision: 0.85,
      recall: 0.92,
      f1_score: 0.88,
      latency: 32,
      throughput: 2100,
      last_updated: '2025-12-19T11:45:00Z',
      status: 'healthy'
    },
    {
      name: 'Anomaly Detection System',
      accuracy: 0.91,
      precision: 0.88,
      recall: 0.89,
      f1_score: 0.885,
      latency: 67,
      throughput: 950,
      last_updated: '2025-12-19T11:30:00Z',
      status: 'critical'
    }
  ]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  // Mock data is now initialized directly in useState to avoid setState in useEffect

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-500/10';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10';
      case 'critical': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const healthyCount = metrics.filter(m => m.status === 'healthy').length;
  const warningCount = metrics.filter(m => m.status === 'warning').length;
  const criticalCount = metrics.filter(m => m.status === 'critical').length;
  const avgAccuracy = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.accuracy, 0) / metrics.length : 0;
  const avgLatency = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Accuracy</p>
                <p className="text-2xl font-bold text-white">{(avgAccuracy * 100).toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500">+2.1% this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Latency</p>
                <p className="text-2xl font-bold text-white">{avgLatency.toFixed(0)}ms</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500">-5.2% this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Healthy Models</p>
                <p className="text-2xl font-bold text-green-500">{healthyCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {healthyCount}/{metrics.length} operational
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Issues Detected</p>
                <p className="text-2xl font-bold text-red-500">{warningCount + criticalCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-yellow-500">{warningCount} warnings</span>
              <span className="text-xs text-red-500">{criticalCount} critical</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Performance Metrics</h3>
            <div className="flex gap-2">
              {(['1h', '24h', '7d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Performance Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">AI Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((model) => (
              <div key={model.name} className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(model.status)}
                    <h4 className="text-white font-medium">{model.name}</h4>
                    <Badge className={`${getStatusColor(model.status)} border-0`}>
                      {model.status.toUpperCase()}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedModel(selectedModel === model.name ? null : model.name)}
                  >
                    {selectedModel === model.name ? 'Hide Details' : 'View Details'}
                  </Button>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{(model.accuracy * 100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{model.latency}ms</div>
                    <div className="text-xs text-slate-400">Latency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{model.throughput}</div>
                    <div className="text-xs text-slate-400">Throughput</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{(model.f1_score * 100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">F1 Score</div>
                  </div>
                </div>

                {/* Detailed Metrics (Expandable) */}
                {selectedModel === model.name && (
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-slate-300 mb-2">Precision Metrics</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Precision:</span>
                            <span className="text-white">{(model.precision * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Recall:</span>
                            <span className="text-white">{(model.recall * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">F1 Score:</span>
                            <span className="text-white">{(model.f1_score * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-slate-300 mb-2">Performance Metrics</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Latency:</span>
                            <span className="text-white">{model.latency}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Throughput:</span>
                            <span className="text-white">{model.throughput}/sec</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Last Updated:</span>
                            <span className="text-white">{new Date(model.last_updated).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-slate-300 mb-2">Actions</h5>
                        <div className="space-y-2">
                          <Button size="sm" variant="secondary" className="w-full">
                            Retrain Model
                          </Button>
                          <Button size="sm" variant="outline" className="w-full">
                            View Training Data
                          </Button>
                          <Button size="sm" variant="outline" className="w-full">
                            Performance History
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {metrics.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            AI Performance Monitoring
          </h3>
          <p className="text-slate-500">
            Track model accuracy, latency, and performance metrics in real-time
          </p>
        </div>
      )}
    </div>
  );
};

export default AiPerformanceMonitor;