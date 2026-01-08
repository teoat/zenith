import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { 
  ShieldCheck, 
  Network, 
  Clock, 
  FileSearch, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  Activity
} from 'lucide-react';

interface ProofSummary {
  metadata_correlations: {
    total_correlations: number;
    types: Record<string, number>;
    confidence: number;
  };
  temporal_bursts: {
    alerts: number;
    risk_score: number;
    patterns: Record<string, number>;
    confidence: number;
  };
  audit_chain: {
    status: string;
    total_entries: number;
    integrity_percentage: number;
    confidence: number;
  };
  shell_networks: {
    networks_detected: number;
    highest_risk_score: number;
    confidence: number;
  };
  overall_confidence: number;
  court_readiness: 'high' | 'medium' | 'low';
}

interface ProofVisualizationProps {
  caseId: string;
  className?: string;
  onViewDetails?: (type: string) => void;
}

const ProofVisualizationCard: React.FC<ProofVisualizationProps> = ({ 
  caseId, 
  className,
  onViewDetails 
}) => {
  const [data, setData] = useState<ProofSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProofSummary = async () => {
      try {
        // In a real app, use the API utility
        const response = await fetch(`http://localhost:8000/api/v1/proof/summary/${caseId}`);
        if (!response.ok) throw new Error('Failed to fetch proof summary');
        const result = await response.json();
        if (result.success) {
          setData(result.proof_summary);
        }
      } catch (err) {
        console.error("Proof fetch error:", err);
        // Fallback or error state
        setError("Unable to load fraud proof data");
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchProofSummary();
    }
  }, [caseId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gray-400 animate-pulse" />
            Generating Fraud Proof...
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Fraud Proof Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "No data available"}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getAdmissibilityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className={`bg-gray-900 border-gray-800 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Fraud Proof Analysis
        </CardTitle>
        <Badge 
          className={`capitalize border ${getAdmissibilityColor(data.court_readiness)}`}
          variant="outline"
        >
          Court Admissibility: {data.court_readiness}
        </Badge>
      </CardHeader>

      <CardContent className="grid gap-6">
        {/* Overall Score */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <div>
            <p className="text-sm text-gray-400">Total Confidence Score</p>
            <h4 className="text-2xl font-bold text-white">{(data.overall_confidence * 100).toFixed(0)}%</h4>
          </div>
          <div className="h-12 w-12 rounded-full border-4 border-primary flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Metadata Correlations */}
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-blue-400" />
                <span className="font-semibold text-gray-200">Metadata</span>
              </div>
              <Badge variant={data.metadata_correlations.total_correlations > 0 ? "default" : "secondary"}>
                {data.metadata_correlations.total_correlations} Detected
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mb-3">Linked via phone, email, or IP</p>
            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${data.metadata_correlations.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Temporal Bursts */}
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-400" />
                <span className="font-semibold text-gray-200">Temporal</span>
              </div>
              {data.temporal_bursts.alerts > 0 ? (
                <Badge variant="destructive">
                  {data.temporal_bursts.alerts} Alerts
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500">None</Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">Structuring & Velocity Patterns</p>
            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${data.temporal_bursts.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Shell Networks */}
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Network className="h-5 w-5 text-purple-400" />
                <span className="font-semibold text-gray-200">Shell Networks</span>
              </div>
              <Badge variant={data.shell_networks.networks_detected > 0 ? "destructive" : "secondary"}>
                {data.shell_networks.networks_detected} Networks
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mb-3">Circular & Tight-knit Groups</p>
            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${data.shell_networks.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Audit Chain */}
          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                <span className="font-semibold text-gray-200">Audit Chain</span>
              </div>
              {data.audit_chain.status === 'valid' ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="destructive">Compromised</Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">{data.audit_chain.total_entries} Signed Entries</p>
            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${data.audit_chain.confidence * 100}%` }}
              />
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full mt-2 border-dashed border-gray-700 hover:border-primary hover:text-primary transition-colors"
          onClick={() => onViewDetails && onViewDetails('summary')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Detailed Proof Rationale
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProofVisualizationCard;
