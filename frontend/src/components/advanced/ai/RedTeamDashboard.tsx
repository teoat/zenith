import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Target, Play, Pause, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface AttackScenario {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed';
  findings: string[];
  execution_time?: number;
}

const RedTeamDashboard: React.FC = () => {
  const [attackScenarios, setAttackScenarios] = useState<AttackScenario[]>([
    {
      id: '1',
      name: 'SQL Injection Attack',
      description: 'Test for SQL injection vulnerabilities in data inputs',
      severity: 'critical',
      status: 'pending',
      findings: []
    },
    {
      id: '2',
      name: 'Cross-Site Scripting (XSS)',
      description: 'Test for XSS vulnerabilities in user inputs and outputs',
      severity: 'high',
      status: 'pending',
      findings: []
    },
    {
      id: '3',
      name: 'API Rate Limiting Bypass',
      description: 'Test for rate limiting bypass and DoS vulnerabilities',
      severity: 'medium',
      status: 'completed',
      findings: ['Rate limiting working correctly', 'No bypass methods found'],
      execution_time: 45
    },
    {
      id: '4',
      name: 'Authentication Bypass',
      description: 'Test for authentication and authorization bypass',
      severity: 'critical',
      status: 'running',
      findings: [],
      execution_time: 120
    }
  ]);

  const [isRunningAll, setIsRunningAll] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-green-500 bg-green-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <RotateCcw className="w-4 h-4 text-gray-500" />;
      case 'running': return <Play className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <RotateCcw className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'running': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const runAttackScenario = async (scenarioId: string) => {
    setAttackScenarios(prev => prev.map(scenario =>
      scenario.id === scenarioId
        ? { ...scenario, status: 'running' as const }
        : scenario
    ));

    // Mock execution
    setTimeout(() => {
      setAttackScenarios(prev => prev.map(scenario =>
        scenario.id === scenarioId
          ? {
              ...scenario,
              status: 'completed' as const,
              findings: ['No vulnerabilities found', 'Security controls working correctly'],
              execution_time: Math.floor(Math.random() * 300) + 30
            }
          : scenario
      ));
    }, 2000);
  };

  const runAllScenarios = async () => {
    setIsRunningAll(true);

    // Run scenarios sequentially
    for (const scenario of attackScenarios.filter(s => s.status === 'pending')) {
      await runAttackScenario(scenario.id);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
    }

    setIsRunningAll(false);
  };

  const resetScenarios = () => {
    setAttackScenarios(prev => prev.map(scenario => ({
      ...scenario,
      status: 'pending' as const,
      findings: [],
      execution_time: undefined
    })));
  };

  const completedCount = attackScenarios.filter(s => s.status === 'completed').length;
  const runningCount = attackScenarios.filter(s => s.status === 'running').length;
  const failedCount = attackScenarios.filter(s => s.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Tests</p>
                <p className="text-2xl font-bold text-white">{attackScenarios.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-green-500">{completedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Running</p>
                <p className="text-2xl font-bold text-blue-500">{runningCount}</p>
              </div>
              <Play className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Failed</p>
                <p className="text-2xl font-bold text-red-500">{failedCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            Red Team Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={runAllScenarios}
              disabled={isRunningAll || attackScenarios.every(s => s.status !== 'pending')}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRunningAll ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>

            <Button onClick={resetScenarios} variant="secondary">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attack Scenarios */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Attack Scenarios</h3>

        {attackScenarios.map((scenario) => (
          <Card key={scenario.id} className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(scenario.status)}
                  <div>
                    <CardTitle className="text-white text-base">{scenario.name}</CardTitle>
                    <p className="text-sm text-slate-400 mt-1">{scenario.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getSeverityColor(scenario.severity)} border-0`}>
                    {scenario.severity.toUpperCase()}
                  </Badge>
                  <Badge className={`${getStatusColor(scenario.status)} bg-transparent border`}>
                    {scenario.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {scenario.execution_time && (
                  <div className="text-sm text-slate-400">
                    Execution Time: {scenario.execution_time}s
                  </div>
                )}

                {scenario.findings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Findings:</h4>
                    <ul className="space-y-1">
                      {scenario.findings.map((finding, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                          <span className="text-slate-300">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => runAttackScenario(scenario.id)}
                    disabled={scenario.status === 'running' || scenario.status === 'completed'}
                    variant={scenario.severity === 'critical' ? 'destructive' : 'secondary'}
                  >
                    {scenario.status === 'running' ? 'Running...' : 'Run Test'}
                  </Button>

                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {attackScenarios.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            Red Team Testing Ready
          </h3>
          <p className="text-slate-500">
            Configure and run automated security tests to identify vulnerabilities
          </p>
        </div>
      )}
    </div>
  );
};

export default RedTeamDashboard;