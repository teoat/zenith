/**
 * CorrelationMatrix - Phase 6E Advanced Visualization
 * Multi-evidence relationship mapping and correlation analysis
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Grid3X3,
  Link2,
  Download,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import './CorrelationMatrix.css';

// Types
interface EvidenceItem {
  id: string;
  name: string;
  type: 'document' | 'transaction' | 'communication' | 'entity' | 'location';
  timestamp?: Date;
}

interface Correlation {
  source: string;
  target: string;
  strength: number;
  type: 'strong' | 'moderate' | 'weak' | 'inverse';
  confidence: number;
  factors: string[];
}

interface CorrelationMatrixProps {
  evidence?: EvidenceItem[];
  correlations?: Correlation[];
  onCellClick?: (source: EvidenceItem, target: EvidenceItem, correlation: Correlation | null) => void;
  onExport?: () => void;
}

// Mock data generator
const generateMockData = () => {
  const evidence: EvidenceItem[] = [
    { id: 'e1', name: 'Bank Statement', type: 'document' },
    { id: 'e2', name: 'Wire Transfer #1234', type: 'transaction' },
    { id: 'e3', name: 'Email Thread', type: 'communication' },
    { id: 'e4', name: 'Shell Company A', type: 'entity' },
    { id: 'e5', name: 'Offshore Account', type: 'transaction' },
    { id: 'e6', name: 'Phone Records', type: 'communication' },
    { id: 'e7', name: 'Invoice #5678', type: 'document' },
    { id: 'e8', name: 'IP Address Log', type: 'location' },
  ];

  const correlations: Correlation[] = [
    { source: 'e1', target: 'e2', strength: 95, type: 'strong', confidence: 98, factors: ['Amount match', 'Date match'] },
    { source: 'e1', target: 'e4', strength: 78, type: 'strong', confidence: 85, factors: ['Account number'] },
    { source: 'e2', target: 'e5', strength: 88, type: 'strong', confidence: 92, factors: ['Routing number', 'Timing'] },
    { source: 'e3', target: 'e4', strength: 65, type: 'moderate', confidence: 75, factors: ['Entity mention'] },
    { source: 'e3', target: 'e6', strength: 82, type: 'strong', confidence: 88, factors: ['Contact match'] },
    { source: 'e4', target: 'e7', strength: 45, type: 'weak', confidence: 60, factors: ['Company name'] },
    { source: 'e5', target: 'e8', strength: 72, type: 'moderate', confidence: 78, factors: ['Timestamp'] },
    { source: 'e6', target: 'e8', strength: 35, type: 'weak', confidence: 55, factors: ['Timing proximity'] },
    { source: 'e1', target: 'e7', strength: -65, type: 'inverse', confidence: 70, factors: ['Discrepancy'] },
  ];

  return { evidence, correlations };
};

// Correlation Cell Component
const CorrelationCell: React.FC<{
  correlation: Correlation | null;
  isDiagonal: boolean;
  showLabels: boolean;
  threshold: number;
  onClick: () => void;
}> = ({ correlation, isDiagonal, showLabels, threshold, onClick }) => {
  if (isDiagonal) {
    return <div className="matrix-cell diagonal" />;
  }

  if (!correlation || Math.abs(correlation.strength) < threshold) {
    return (
      <div className="matrix-cell empty" onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }} tabIndex={0} role="button">
        <span className="cell-empty-indicator">—</span>
      </div>
    );
  }

  const getColor = (strength: number, type: string) => {
    if (type === 'inverse') {
      return `rgba(239, 68, 68, ${Math.abs(strength) / 100})`;
    }
    if (strength >= 80) return `rgba(34, 197, 94, ${strength / 100})`;
    if (strength >= 60) return `rgba(59, 130, 246, ${strength / 100})`;
    if (strength >= 40) return `rgba(234, 179, 8, ${strength / 100})`;
    return `rgba(100, 116, 139, ${strength / 100})`;
  };

  const getIcon = (type: Correlation['type']) => {
    switch (type) {
      case 'strong': return <CheckCircle className="w-3 h-3" />;
      case 'inverse': return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div
      className={`matrix-cell filled ${correlation.type}`}
      style={{ background: getColor(correlation.strength, correlation.type) }}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      tabIndex={0}
      role="button"
    >
      {showLabels && (
        <span className="cell-value">
          {correlation.type === 'inverse' ? '-' : ''}{Math.abs(correlation.strength)}
        </span>
      )}
      {!showLabels && getIcon(correlation.type)}
    </div>
  );
};

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({
  evidence: propEvidence,
  correlations: propCorrelations,
  onCellClick,
  onExport
}) => {
  const mockData = useMemo(() => generateMockData(), []);
  const evidence = propEvidence || mockData.evidence;
  const correlations = propCorrelations || mockData.correlations;

  const [threshold, setThreshold] = useState(20);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ source: string; target: string } | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Build correlation lookup map
  const correlationMap = useMemo(() => {
    const map = new Map<string, Correlation>();
    correlations.forEach(corr => {
      map.set(`${corr.source}-${corr.target}`, corr);
      map.set(`${corr.target}-${corr.source}`, { ...corr, source: corr.target, target: corr.source });
    });
    return map;
  }, [correlations]);

  // Filter evidence by type
  const filteredEvidence = useMemo(() => {
    if (!filterType) return evidence;
    return evidence.filter(e => e.type === filterType);
  }, [evidence, filterType]);

  // Statistics
  const stats = useMemo(() => {
    const activeCorrelations = correlations.filter(c => Math.abs(c.strength) >= threshold);
    const strong = activeCorrelations.filter(c => c.type === 'strong').length;
    const inverse = activeCorrelations.filter(c => c.type === 'inverse').length;
    const avgStrength = activeCorrelations.length > 0
      ? Math.round(activeCorrelations.reduce((sum, c) => sum + Math.abs(c.strength), 0) / activeCorrelations.length)
      : 0;
    
    return { total: activeCorrelations.length, strong, inverse, avgStrength };
  }, [correlations, threshold]);

  const selectedCorrelation = useMemo(() => {
    if (!selectedCell) return null;
    return correlationMap.get(`${selectedCell.source}-${selectedCell.target}`) || null;
  }, [selectedCell, correlationMap]);

  const handleCellClick = useCallback((sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    
    setSelectedCell({ source: sourceId, target: targetId });
    
    const source = evidence.find(e => e.id === sourceId);
    const target = evidence.find(e => e.id === targetId);
    const correlation = correlationMap.get(`${sourceId}-${targetId}`) || null;
    
    if (source && target && onCellClick) {
      onCellClick(source, target, correlation);
    }
  }, [evidence, correlationMap, onCellClick]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      document: '#3b82f6',
      transaction: '#10b981',
      communication: '#f59e0b',
      entity: '#8b5cf6',
      location: '#ec4899'
    };
    return colors[type] || '#64748b';
  };

  return (
    <Card className="correlation-matrix-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="matrix-icon">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Evidence Correlation Matrix</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Multi-evidence relationship mapping
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Link2 className="w-3 h-3" />
              {stats.total} Correlations
            </Badge>
            {stats.inverse > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.inverse} Discrepancies
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="matrix-controls">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="labels" className="text-sm">Values</Label>
              <Switch
                id="labels"
                checked={showLabels}
                onCheckedChange={setShowLabels}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Threshold:</span>
              <div className="w-32">
                <Slider
                  value={[threshold]}
                  onValueChange={([val]) => setThreshold(val)}
                  max={100}
                  step={5}
                />
              </div>
              <span className="text-sm font-medium">{threshold}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={filterType === null ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setFilterType(null)}
            >
              All
            </Button>
            {['document', 'transaction', 'communication', 'entity'].map(type => (
              <Button
                key={type}
                variant={filterType === type ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setFilterType(filterType === type ? null : type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}s
              </Button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>

        {/* Matrix Grid */}
        <div className="matrix-container">
          <ScrollArea className="matrix-scroll">
            <div className="matrix-grid" style={{ 
              gridTemplateColumns: `100px repeat(${filteredEvidence.length}, 1fr)`,
              gridTemplateRows: `40px repeat(${filteredEvidence.length}, 1fr)`
            }}>
              {/* Header row */}
              <div className="matrix-corner" />
              {filteredEvidence.map(item => (
                <div key={`h-${item.id}`} className="matrix-header">
                  <div 
                    className="header-indicator"
                    style={{ background: getTypeColor(item.type) }}
                  />
                  <span className="header-label" title={item.name}>
                    {item.name.length > 10 ? item.name.slice(0, 10) + '...' : item.name}
                  </span>
                </div>
              ))}

              {/* Data rows */}
              {filteredEvidence.map(rowItem => (
                <React.Fragment key={`r-${rowItem.id}`}>
                  <div className="matrix-row-label">
                    <div 
                      className="row-indicator"
                      style={{ background: getTypeColor(rowItem.type) }}
                    />
                    <span title={rowItem.name}>
                      {rowItem.name.length > 12 ? rowItem.name.slice(0, 12) + '...' : rowItem.name}
                    </span>
                  </div>
                  {filteredEvidence.map(colItem => (
                    <CorrelationCell
                      key={`${rowItem.id}-${colItem.id}`}
                      correlation={correlationMap.get(`${rowItem.id}-${colItem.id}`) || null}
                      isDiagonal={rowItem.id === colItem.id}
                      showLabels={showLabels}
                      threshold={threshold}
                      onClick={() => handleCellClick(rowItem.id, colItem.id)}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Selected Correlation Details */}
        {selectedCorrelation && (
          <div className="correlation-details">
            <div className="details-header">
              <Info className="w-4 h-4" />
              <span className="font-medium">Correlation Details</span>
              <Badge 
                variant={selectedCorrelation.type === 'inverse' ? 'destructive' : 
                         selectedCorrelation.type === 'strong' ? 'default' : 'secondary'}
              >
                {selectedCorrelation.type}
              </Badge>
            </div>
            <div className="details-content">
              <div className="detail-row">
                <span className="detail-label">Strength</span>
                <div className="strength-bar-container">
                  <div 
                    className="strength-bar"
                    style={{ 
                      width: `${Math.abs(selectedCorrelation.strength)}%`,
                      background: selectedCorrelation.type === 'inverse' ? '#ef4444' : '#3b82f6'
                    }}
                  />
                </div>
                <span className="detail-value">{Math.abs(selectedCorrelation.strength)}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Confidence</span>
                <span className="detail-value">{selectedCorrelation.confidence}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Factors</span>
                <div className="factor-tags">
                  {selectedCorrelation.factors.map((factor, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="matrix-legend">
          <div className="legend-section">
            <span className="legend-title">Strength</span>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-color strong" />
                <span>Strong (80%+)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color moderate" />
                <span>Moderate (40-79%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color weak" />
                <span>Weak (&lt;40%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color inverse" />
                <span>Discrepancy</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CorrelationMatrix;
