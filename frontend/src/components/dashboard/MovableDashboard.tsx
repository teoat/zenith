import React, { useState, useEffect } from 'react';
import { ResponsiveGridLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { Activity, AlertTriangle, FolderOpen, Users, Lock, Unlock } from 'lucide-react';
import ThreatMap from './ThreatMap';
import AIWatchtower from './AIWatchtower';
import LiveQueue from './LiveQueue';
import VolumeChart from './VolumeChart';
import RiskDistributionChart from './RiskDistributionChart';
import ProofVisualizationCard from './ProofVisualizationCard';
import MetricSparkline from './MetricSparkline';
import { useProjectStore } from '../../store/projectStore';



interface KPICardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    trend: string;
    isCritical?: boolean;
    sparklineData?: number[];
    sparklineColor?: string;
}

const KPICard = ({ title, value, icon, trend, isCritical = false, sparklineData, sparklineColor }: KPICardProps) => (
    <div className={`h-full p-4 rounded-xl border shadow-sm flex flex-col justify-between ${
        isCritical ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
    }`}>
        <div className="flex justify-between items-start">
            <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-100 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {icon}
            </div>
            {trend && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isCritical ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{trend}</span>}
        </div>
        <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        </div>
        {sparklineData && (
            <div className="h-8 w-full mt-2">
                <MetricSparkline data={sparklineData} color={sparklineColor} height={32} />
            </div>
        )}
    </div>
);

const WidgetWrapper = ({ children, className = "", title }: { children: React.ReactNode; className?: string, title?: string }) => (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full overflow-hidden flex flex-col ${className}`}>
        {title && (
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 font-medium text-sm text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                {title}
            </div>
        )}
        <div className="flex-1 min-h-0 relative">
            {children}
        </div>
    </div>
);

const MovableDashboard: React.FC = () => {
    const { activeProjectId } = useProjectStore();
    const { data: metrics } = useDashboardMetrics();
    const [isDraggable, setIsDraggable] = useState(false);
    
    // Default Layout
    const defaultLayouts = {
        lg: [
            { i: 'kpi_total', x: 0, y: 0, w: 3, h: 4 },
            { i: 'kpi_open', x: 3, y: 0, w: 3, h: 4 },
            { i: 'kpi_critical', x: 6, y: 0, w: 3, h: 4 },
            { i: 'kpi_analysts', x: 9, y: 0, w: 3, h: 4 },
            { i: 'threat_map', x: 0, y: 4, w: 8, h: 10 },
            { i: 'ai_watchtower', x: 8, y: 4, w: 4, h: 6 },
            { i: 'proof_card', x: 8, y: 10, w: 4, h: 4 },
            { i: 'live_queue', x: 0, y: 14, w: 4, h: 8 },
            { i: 'volume_chart', x: 4, y: 14, w: 4, h: 8 },
            { i: 'risk_chart', x: 8, y: 14, w: 4, h: 8 },
        ]
    };

    const [layouts, setLayouts] = useState(() => {
        const saved = localStorage.getItem('dashboard_layout');
        return saved ? JSON.parse(saved) : defaultLayouts;
    });

    const onLayoutChange = (layout: any, allLayouts: any) => {
        setLayouts(allLayouts);
        localStorage.setItem('dashboard_layout', JSON.stringify(allLayouts));
    };

    // Calculate volume data (reused logic)
    const volumeData = React.useMemo(() => {
        if ((metrics as any)?.volumeTrend) return (metrics as any).volumeTrend;
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                volume: 2000 + Math.floor(Math.abs(Math.sin(i + 1) * 1500))
            };
        });
    }, [metrics]);

    return (
        <div className="w-full relative">
            <div className="flex justify-end mb-4 px-2">
                <button 
                    onClick={() => setIsDraggable(!isDraggable)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isDraggable 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                >
                    {isDraggable ? <Unlock size={14} /> : <Lock size={14} />}
                    {isDraggable ? 'Unlock Layout' : 'Lock Layout'}
                </button>
            </div>

            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={30}
                isDraggable={isDraggable}
                isResizable={isDraggable}
                onLayoutChange={onLayoutChange}
                margin={[16, 16]}
            >
                <div key="kpi_total">
                    <KPICard 
                        title="Total Cases" 
                        value={metrics?.totalCases || 0} 
                        icon={<FolderOpen className="text-blue-500" />} 
                        trend=""
                        sparklineData={metrics?.sparklineData?.totalCases}
                        sparklineColor="#3b82f6"
                    />
                </div>
                <div key="kpi_open">
                    <KPICard 
                        title="Open Investigations" 
                        value={metrics?.openCases || 0} 
                        icon={<Activity className="text-amber-500" />} 
                        trend=""
                        sparklineData={metrics?.sparklineData?.openCases}
                        sparklineColor="#f59e0b"
                    />
                </div>
                <div key="kpi_critical">
                    <KPICard 
                        title="Critical Alerts" 
                        value={metrics?.criticalCases || 0} 
                        icon={<AlertTriangle className="text-red-500" />} 
                        isCritical 
                        trend=""
                        sparklineData={metrics?.sparklineData?.criticalCases}
                        sparklineColor="#ef4444"
                    />
                </div>
                <div key="kpi_analysts">
                    <KPICard 
                        title="Active Analysts" 
                        value={metrics?.activeAnalysts || 0}
                        icon={<Users className="text-emerald-500" />} 
                        trend=""
                        sparklineData={metrics?.sparklineData?.analysts}
                        sparklineColor="#10b981"
                    />
                </div>

                <div key="threat_map">
                    <WidgetWrapper className="bg-slate-900 border-none" title="Global Threat Map">
                         <ThreatMap />
                    </WidgetWrapper>
                </div>

                <div key="ai_watchtower">
                    <AIWatchtower />
                </div>

                <div key="proof_card">
                    <ProofVisualizationCard caseId={activeProjectId || '492'} />
                </div>
                
                <div key="live_queue">
                    <WidgetWrapper title="Live Queue">
                        <LiveQueue />
                    </WidgetWrapper>
                </div>

                <div key="volume_chart">
                    <WidgetWrapper title="Processing Volume">
                        <VolumeChart data={volumeData} />
                    </WidgetWrapper>
                </div>

                <div key="risk_chart">
                    <WidgetWrapper title="Risk Distribution">
                        <RiskDistributionChart data={[
                            { name: 'Critical', value: metrics?.riskDistribution?.critical || 0, color: '#ef4444' }, 
                            { name: 'High', value: metrics?.riskDistribution?.high || 0, color: '#f59e0b' },     
                            { name: 'Medium', value: metrics?.riskDistribution?.medium || 0, color: '#3b82f6' },   
                            { name: 'Low', value: metrics?.riskDistribution?.low || 0, color: '#10b981' }, 
                        ]} />
                    </WidgetWrapper>
                </div>

            </ResponsiveGridLayout>
        </div>
    );
};

export default MovableDashboard;
