/**
 * BehavioralHeatmap - Phase 6E Advanced Visualization
 * Geographic and temporal pattern analysis heatmap
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
// Select components not currently used
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Map,
  Clock,
  Activity,
  TrendingUp,
  AlertTriangle,
  Grid,
  Download
} from 'lucide-react';
import './BehavioralHeatmap.css';

import { api } from '@/lib/api';
import { TimeSeriesData, GeoData, HeatmapCell } from '@/types/api';

// Types
/* Types imported from API */

interface BehavioralHeatmapProps {
  data?: TimeSeriesData[];
  geoData?: GeoData[];
  onCellClick?: (cell: HeatmapCell) => void;
  onRegionClick?: (region: GeoData) => void;
}

// Mock generators removed

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Heatmap Cell Component
const HeatCell: React.FC<{
  value: number;
  maxValue: number;
  x: number;
  y: number;
  label: string;
  onClick?: () => void;
}> = ({ value, maxValue, label, onClick }) => {
  const intensity = value / maxValue;
  
  const getColor = (intensity: number) => {
    if (intensity >= 0.8) return 'rgba(239, 68, 68, 0.9)'; // Red
    if (intensity >= 0.6) return 'rgba(249, 115, 22, 0.9)'; // Orange
    if (intensity >= 0.4) return 'rgba(234, 179, 8, 0.8)'; // Yellow
    if (intensity >= 0.2) return 'rgba(34, 197, 94, 0.7)'; // Green
    return 'rgba(59, 130, 246, 0.5)'; // Blue
  };

  return (
    <button
      type="button"
      className="heat-cell"
      style={{ background: getColor(intensity) }}
      onClick={onClick}
      title={`${label}: ${value}`}
      aria-label={`${label}: ${value}`}
    >
      {value > 50 && <span className="cell-value">{value}</span>}
    </button>
  );
};

// Geographic Region Component
const GeoRegion: React.FC<{
  region: GeoData;
  maxValue: number;
  onClick?: () => void;
}> = ({ region, maxValue, onClick }) => {
  const getRiskColor = (level: GeoData['riskLevel']) => {
    switch (level) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#eab308';
      default: return '#22c55e';
    }
  };

  return (
    <button type="button" className="geo-region w-full text-left" onClick={onClick}>
      <div className="region-header">
        <div 
          className="region-indicator"
          style={{ background: getRiskColor(region.riskLevel) }}
        />
        <span className="region-name">{region.region}</span>
        <Badge 
          variant={region.riskLevel === 'critical' ? 'destructive' : 'outline'}
          className="ml-auto"
        >
          {region.riskLevel}
        </Badge>
      </div>
      <div className="region-bar-container">
        <div 
          className="region-bar"
          style={{ 
            width: `${(region.value / maxValue) * 100}%`,
            background: getRiskColor(region.riskLevel)
          }}
        />
      </div>
      <div className="region-stats">
        <span>Activity Score: {region.value}</span>
      </div>
    </button>
  );
};

export const BehavioralHeatmap: React.FC<BehavioralHeatmapProps> = ({
  data: propData,
  geoData: propGeoData,
  onCellClick,
  onRegionClick
}) => {
  const [timeData, setTimeData] = useState<TimeSeriesData[]>(propData || []);
  const [geoData, setGeoData] = useState<GeoData[]>(propGeoData || []);
  const [isLoading, setIsLoading] = useState(!propData || !propGeoData);

  useEffect(() => {
    if (!propData || !propGeoData) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const result = await api.getBehavioralAnalytics();
          if (!propData) setTimeData(result.timeData);
          if (!propGeoData) setGeoData(result.geoData);
        } catch (err) {
          console.error("Failed to fetch behavioral analytics:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [propData, propGeoData]);
  
  const [viewMode, setViewMode] = useState<'temporal' | 'geographic'>('temporal');
  const [timeRange, _setTimeRange] = useState<[number, number]>([0, 23]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(50);

  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  // Calculate max value for color scaling
  const maxValue = useMemo(() => {
    return Math.max(...timeData.map(d => d.value));
  }, [timeData]);

  const maxGeoValue = useMemo(() => {
    return Math.max(...geoData.map(d => d.value));
  }, [geoData]);

  // Statistics
  const stats = useMemo(() => {
    const filtered = timeData.filter(d => 
      d.hour >= timeRange[0] && 
      d.hour <= timeRange[1] &&
      (selectedDay === null || d.day === selectedDay)
    );
    
    
    const total = filtered.reduce((sum, d) => sum + d.value, 0);
    const suspicious = filtered.filter(d => d.value >= threshold).length;
    const avgValue = total / (filtered.length || 1);
    
    return { total, suspicious, avgValue: Math.round(avgValue), count: filtered.length };
  }, [timeData, timeRange, selectedDay, threshold]);

  const handleCellClick = useCallback((hour: number, day: number) => {
    const cell = timeData.find(d => d.hour === hour && d.day === day);
    if (cell && onCellClick) {
      onCellClick({ x: hour, y: day, value: cell.value, label: `${DAY_NAMES[day]} ${hour}:00` });
    }
  }, [timeData, onCellClick]);

  if (isLoading) {
    return (
      <Card className="behavioral-heatmap-card flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading behavioral analytics...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="behavioral-heatmap-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="heatmap-icon">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Behavioral Heatmap</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pattern analysis across time and geography
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Activity className="w-3 h-3" />
              {stats.count} Data Points
            </Badge>
            {stats.suspicious > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.suspicious} Anomalies
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <div className="flex items-center justify-between">
            <TabsList className="bg-slate-800/50">
              <TabsTrigger value="temporal" className="gap-2">
                <Clock className="w-4 h-4" />
                Temporal
              </TabsTrigger>
              <TabsTrigger value="geographic" className="gap-2">
                <Map className="w-4 h-4" />
                Geographic
              </TabsTrigger>
            </TabsList>

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
              <span className="text-sm font-medium">{threshold}</span>
            </div>
          </div>

          <TabsContent value="temporal" className="mt-4">
            {/* Temporal Heatmap */}
            <div className="temporal-heatmap">
              {/* Screen Reader Only Table for Temporal Data */}
              <div className="sr-only">
                <table>
                  <caption>Temporal Activity Heatmap Data</caption>
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Hour</th>
                      <th>Activity Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeData.map((d, i) => (
                      <tr key={i}>
                        <td>{DAY_NAMES[d.day]}</td>
                        <td>{d.hour}:00</td>
                        <td>{d.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Time axis */}
              <div className="time-axis">
                <div className="axis-label" />
                {hours.filter((_, i) => i % 3 === 0).map((hour, i) => (
                  <div key={i} className="axis-label">{hour}</div>
                ))}
              </div>

              {/* Heatmap grid */}
              <div className="heatmap-grid">
                {DAY_NAMES.map((day, dayIndex) => (
                  <div key={day} className="heatmap-row">
                    <button
                      type="button" 
                      className={`day-label text-left ${selectedDay === dayIndex ? 'selected' : ''}`}
                      onClick={() => setSelectedDay(selectedDay === dayIndex ? null : dayIndex)}
                    >
                      {day}
                    </button>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const dataPoint = timeData.find(d => d.hour === hour && d.day === dayIndex);
                      return (
                        <HeatCell
                          key={hour}
                          value={dataPoint?.value || 0}
                          maxValue={maxValue}
                          x={hour}
                          y={dayIndex}
                          label={`${day} ${hour}:00`}
                          onClick={() => handleCellClick(hour, dayIndex)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Color Legend */}
              <div className="heatmap-legend">
                <span className="legend-label">Low</span>
                <div className="legend-gradient" />
                <span className="legend-label">High</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="geographic" className="mt-4">
            {/* Geographic View */}
            <div className="geographic-view">
              <div className="geo-regions">
                {geoData
                  .sort((a, b) => b.value - a.value)
                  .map(region => (
                    <GeoRegion
                      key={region.region}
                      region={region}
                      maxValue={maxGeoValue}
                      onClick={() => onRegionClick?.(region)}
                    />
                  ))}
              </div>

              {/* Screen Reader Only Table for Geographic Data */}
              <div className="sr-only">
                <table>
                  <caption>Geographic Risk Analysis Data</caption>
                  <thead>
                    <tr>
                      <th>Region</th>
                      <th>Risk Level</th>
                      <th>Activity Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geoData.map(region => (
                      <tr key={region.region}>
                        <td>{region.region}</td>
                        <td>{region.riskLevel}</td>
                        <td>{region.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="geo-summary">
                <div className="summary-card">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Regions</p>
                    <p className="font-semibold text-lg">{geoData.length}</p>
                  </div>
                </div>
                <div className="summary-card">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Critical</p>
                    <p className="font-semibold text-lg">
                      {geoData.filter(r => r.riskLevel === 'critical').length}
                    </p>
                  </div>
                </div>
                <div className="summary-card">
                  <Activity className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">High Risk</p>
                    <p className="font-semibold text-lg">
                      {geoData.filter(r => r.riskLevel === 'high').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Stats Footer */}
        <div className="stats-footer">
          <div className="stat-item">
            <span className="stat-label">Avg Activity</span>
            <span className="stat-value">{stats.avgValue}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Above Threshold</span>
            <span className="stat-value text-red-400">{stats.suspicious}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Time Range</span>
            <span className="stat-value">{timeRange[0]}:00 - {timeRange[1]}:00</span>
          </div>
          <Button variant="outline" size="sm" className="ml-auto">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BehavioralHeatmap;
