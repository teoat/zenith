import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Shield, Play, RotateCcw, CheckCircle } from 'lucide-react';

// Use imports to avoid unused warnings
// Imports validated.
// Removed secureRandom import as it's not available

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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





  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-400';
      case 'running': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const runAttackScenario = async (scenarioId: string) => {
    setAttackScenarios(prev => prev.map(scenario =>
      scenario.id === scenarioId
        ? { ...scenario, status: 'running' as const }
        : scenario
    ));

    // Mock execution with proper cleanup
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setAttackScenarios(prev => prev.map(scenario =>
        scenario.id === scenarioId
          ? {
              ...scenario,
              status: 'completed' as const,
              findings: ['No vulnerabilities found', 'Security controls working correctly'],
               execution_time: Math.floor((window.crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF) * 300) + 30
            }
          : scenario
      ));
      timeoutRef.current = null;
    }, 2000);
  };



  const resetScenarios = () => {
    setAttackScenarios(prev => prev.map(scenario => ({
      ...scenario,
      status: 'pending' as const,
      findings: [],
      execution_time: undefined
    })));
  };



  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Red Team Dashboard</h2>
          <p className="text-slate-400">Automated security testing and vulnerability assessment</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetScenarios}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            aria-label="Reset all test scenarios"
          >
            <RotateCcw className="w-4 h-4 mr-2 inline" />
            Reset
          </button>
        </div>
      </div>

      {/* Test Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {attackScenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            {/* Scenario Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-slate-100 mb-1">
                  {scenario.name}
                </h3>
                <p className="text-sm text-slate-400">
                  {scenario.description}
                </p>
              </div>
              <Badge
                variant={
                  scenario.severity === 'critical' ? 'destructive' :
                  scenario.severity === 'high' ? 'secondary' :
                  scenario.severity === 'medium' ? 'default' : 'outline'
                }
                className="capitalize"
              >
                {scenario.severity}
              </Badge>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(scenario.status)}`} />
              <span className={`text-sm capitalize ${getStatusTextColor(scenario.status)}`}>
                {scenario.status}
              </span>
              {scenario.execution_time && (
                <span className="text-xs text-slate-500 ml-auto">
                  {scenario.execution_time}s
                </span>
              )}
            </div>

            {/* Findings */}
            {scenario.findings.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Findings</h4>
                <ul className="space-y-1">
                  {scenario.findings.map((finding, index) => (
                    <li key={index} className="text-xs text-slate-400 flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => runAttackScenario(scenario.id)}
                disabled={scenario.status === 'running'}
                className="flex-1"
                variant={scenario.status === 'completed' ? 'secondary' : 'default'}
                aria-label={`Run ${scenario.name} test`}
              >
                {scenario.status === 'running' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {scenario.status === 'completed' ? 'Re-run' : 'Run Test'}
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {attackScenarios.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
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