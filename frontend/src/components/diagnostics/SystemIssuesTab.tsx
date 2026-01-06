import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, TrendingUp, Shield, Server, CheckCircle } from 'lucide-react';
import { DiagnosticIssue } from '@/types/system-diagnostics';

interface SystemIssuesTabProps {
  issues: DiagnosticIssue[];
  onResolve: (id: string) => void;
}

export const SystemIssuesTab: React.FC<SystemIssuesTabProps> = ({ issues, onResolve }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700';
      case 'high': return 'text-orange-700';
      case 'medium': return 'text-yellow-700';
      case 'low': return 'text-blue-700';
      default: return 'text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'reliability': return <Server className="h-4 w-4" />;
      case 'compliance': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <Card key={issue.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getCategoryIcon(issue.category)}
                  <Badge className={getSeverityColor(issue.severity)}>
                    {issue.severity.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{issue.category}</Badge>
                </div>
                <CardTitle className="text-lg">{issue.title}</CardTitle>
                <CardDescription className="mt-2">{issue.description}</CardDescription>
              </div>
              {!issue.resolved_at && (
                <Button
                  size="sm"
                  onClick={() => onResolve(issue.id)}
                >
                  Resolve
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Affected Services:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {issue.affected_services.map((service, index) => (
                    <Badge key={index} variant="secondary">{service}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Recommendations:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                  {issue.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Detected: {new Date(issue.detected_at).toLocaleString()}</span>
                {issue.resolved_at && (
                  <span>Resolved: {new Date(issue.resolved_at).toLocaleString()}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
