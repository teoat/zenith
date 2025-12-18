import React, { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, FileSearch, Image, Shield, BarChart3, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingState from '@/components/LoadingState';

const RagSearchInterface = React.lazy(() => import('../components/advanced/ai/RagSearchInterface'));
const MultimodalAnalyzer = React.lazy(() => import('../components/advanced/ai/MultimodalAnalyzer'));
const RedTeamDashboard = React.lazy(() => import('../components/advanced/ai/RedTeamDashboard'));
const AiPerformanceMonitor = React.lazy(() => import('../components/advanced/ai/AiPerformanceMonitor'));

const AdvancedAiHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rag');

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-500" />
              Advanced AI Hub
            </h1>
            <p className="text-slate-400 mt-2">
              Unified interface for advanced AI capabilities and machine learning tools
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance
            </Button>
            <Button variant="primary" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Actions
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-blue-500" />
                RAG Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">2,847</div>
              <p className="text-xs text-slate-500">Documents indexed</p>
              <div className="mt-2 text-xs text-green-500">+12% this week</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Image className="w-4 h-4 text-purple-500" />
                Multimodal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">1,234</div>
              <p className="text-xs text-slate-500">Files analyzed</p>
              <div className="mt-2 text-xs text-green-500">98.5% accuracy</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                Red Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">47</div>
              <p className="text-xs text-slate-500">Tests executed</p>
              <div className="mt-2 text-xs text-yellow-500">3 vulnerabilities found</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-500" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">94.2%</div>
              <p className="text-xs text-slate-500">Model accuracy</p>
              <div className="mt-2 text-xs text-green-500">+2.1% this month</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="bg-slate-900 border-slate-800">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800">
              <TabsTrigger value="rag" className="flex items-center gap-2">
                <FileSearch className="w-4 h-4" />
                RAG Engine
              </TabsTrigger>
              <TabsTrigger value="multimodal" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Multimodal
              </TabsTrigger>
              <TabsTrigger value="redteam" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Red Team
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rag" className="mt-6">
              <Suspense fallback={<LoadingState />}>
                <RagSearchInterface />
              </Suspense>
            </TabsContent>

            <TabsContent value="multimodal" className="mt-6">
              <Suspense fallback={<LoadingState />}>
                <MultimodalAnalyzer />
              </Suspense>
            </TabsContent>

            <TabsContent value="redteam" className="mt-6">
              <Suspense fallback={<LoadingState />}>
                <RedTeamDashboard />
              </Suspense>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <Suspense fallback={<LoadingState />}>
                <AiPerformanceMonitor />
              </Suspense>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAiHub;