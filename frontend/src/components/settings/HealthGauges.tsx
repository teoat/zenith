import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Wifi, Clock, Activity, Database } from 'lucide-react';
import { api } from '../../lib/api';
import { secureLogger } from '../../utils/secureLogger';

interface Gauge {
  label: string;
  value: number;
  max: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

const HealthGauges: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null); // Using any to avoid importing deep types if not needed, or map strictly
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
        try {
            const data = await api.getSystemStatus();
            setMetrics(data.metrics);
        } catch (err) {
            secureLogger.error('Failed to fetch health metrics:', err);
             // Keep loading or show error? For dashboard widgets, silent fail or fallback is often better, but let's show default/zeros
        } finally {
            setLoading(false);
        }
    };
    
    fetchMetrics();
    // Poll every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const gauges: Gauge[] = [
    { 
        label: 'CPU Usage', 
        value: metrics?.cpu_percent || 0, 
        max: 100, 
        unit: '%', 
        icon: <Cpu size={16} />, 
        color: '#3b82f6' 
    },
    { 
        label: 'Memory', 
        value: metrics ? parseFloat((metrics.memory_used_mb / 1024).toFixed(1)) : 0, 
        max: 8, // Assuming 8GB for visualization scaling
        unit: 'GB', 
        icon: <HardDrive size={16} />, 
        color: '#10b981' 
    },
    { 
        label: 'Latency', 
        value: metrics ? Math.round(metrics.response_time_avg) : 0, 
        max: 200, 
        unit: 'ms', 
        icon: <Clock size={16} />, 
        color: '#f59e0b' 
    },
    { 
        label: 'DB Connections', 
        value: metrics?.network_connections || 0, 
        max: 50, 
        unit: '', 
        icon: <Database size={16} />, 
        color: '#8b5cf6' 
    },
    { 
        label: 'Request Rate', 
        value: metrics?.request_count || 0, 
        max: 1000, 
        unit: 'rpm', 
        icon: <Wifi size={16} />, 
        color: '#ec4899' 
    },
    { 
        label: 'Active Threads', 
        value: metrics?.active_threads || 0, 
        max: 100, 
        unit: '', 
        icon: <Activity size={16} />, 
        color: '#06b6d4' 
    },
  ];

  const getStatus = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio < 0.5) return 'text-green-600';
    if (ratio < 0.8) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <Activity size={18} className="text-green-500" />
          System Health
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <span className={`w-2 h-2 rounded-full ${loading ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`}></span>
          {loading ? 'Connecting...' : 'All Systems Operational'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
        {gauges.map((gauge, i) => {
          const percentage = Math.min(100, (gauge.value / gauge.max) * 100);
          
          return (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded bg-white dark:bg-slate-700" style={{ color: gauge.color }}>
                  {gauge.icon}
                </div>
                <span className="text-xs font-medium text-slate-500">{gauge.label}</span>
              </div>

              {/* Circular Gauge */}
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background */}
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  {/* Progress */}
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke={gauge.color}
                    strokeWidth="3"
                    strokeDasharray={`${percentage} 100`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${getStatus(gauge.value, gauge.max)}`}>
                    {gauge.value}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs text-slate-400">
                  {gauge.value}{gauge.unit} / {gauge.max}{gauge.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
        <span className="text-xs text-slate-500">Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default HealthGauges;
