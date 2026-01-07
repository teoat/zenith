import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Brain, Sparkles, Beaker, Rocket, Lightbulb, GitBranch, Play, RefreshCw, Layers } from 'lucide-react';
import { secureLogger } from '@/utils/secureLogger';

interface Experiment {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'completed' | 'failed' | 'draft';
  accuracy: number;
  duration: string;
}

const AILab: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate fetching experiments
    setExperiments([
      { id: '1', name: 'Temporal Burst Detection V2', type: 'Anomaly Detection', status: 'running', accuracy: 0.94, duration: '4h 20m' },
      { id: '2', name: 'Transformer-based Entity Linkage', type: 'Graph Analysis', status: 'completed', accuracy: 0.88, duration: '12h 05m' },
      { id: '3', name: 'Sentiment Analysis (Financial Context)', type: 'NLP', status: 'draft', accuracy: 0, duration: '-' },
    ]);
  }, []);

  const runExperiment = async (id: string) => {
    setLoading(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call to InnovationService
        secureLogger.info(`Experiment ${id} started`);
        // In real app: api.startExperiment(id)
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Beaker className="h-8 w-8 text-indigo-600" />
            AI Innovation Lab
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Experimental workspace for training, evaluating, and deploying next-gen fraud detection models.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all">
          <Rocket className="mr-2 h-4 w-4" />
          New Experiment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Experiments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">3</div>
            <p className="text-xs text-slate-500 mt-1">+1 from yesterday</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Model Accuracy (Avg)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">92.4%</div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center">
              <Sparkles className="h-3 w-3 mr-1" /> Top Tier Performance
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">GPU Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">78%</div>
            <p className="text-xs text-slate-500 mt-1">Cluster A (AWS p3.2xlarge)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="experiments" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-4">
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="models">Model Registry</TabsTrigger>
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
        </TabsList>

        <TabsContent value="experiments" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Experiments</CardTitle>
              <CardDescription>
                Manage and monitor your ongoing machine learning experiments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {experiments.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:border-indigo-200 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${exp.status === 'running' ? 'bg-indigo-100 text-indigo-600' : exp.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {exp.status === 'running' ? <RefreshCw className="h-5 w-5 animate-spin" /> : 
                         exp.status === 'completed' ? <Lightbulb className="h-5 w-5" /> : 
                         <GitBranch className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{exp.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{exp.type}</Badge>
                          <span className="text-xs text-slate-500">• Duration: {exp.duration}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {exp.accuracy > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-900">{(exp.accuracy * 100).toFixed(1)}%</div>
                          <div className="text-xs text-slate-500">Accuracy</div>
                        </div>
                      )}
                      <Button 
                        variant={exp.status === 'running' ? "destructive" : "secondary"} 
                        size="sm"
                        disabled={loading}
                        onClick={() => runExperiment(exp.id)}
                      >
                        {exp.status === 'running' ? 'Stop' : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 border-2 border-dashed rounded-lg">
            <Layers className="h-12 w-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900">Model Registry Empty</h3>
            <p className="max-w-sm mt-2">Deploy your successful experiments to the model registry to make them available for production.</p>
          </div>
        </TabsContent>

        <TabsContent value="datasets">
           <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 border-2 border-dashed rounded-lg">
            <Brain className="h-12 w-12 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900">No Datasets Connected</h3>
            <p className="max-w-sm mt-2">Connect S3 buckets or upload CSV/Parquet files to start training models.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AILab;
