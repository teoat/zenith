import React, { useState, useEffect } from "react";
import { useToast } from "@/providers/ToastProvider";
import {
  AlertCircle,
  TrendingUp,
  Shield,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import type { PredictiveStats } from "@/types/api";

const PredictiveDashboard: React.FC = () => {
  const [stats, setStats] = useState<PredictiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getPredictiveStats();
      setStats(data);
    } catch (e) {
      addToast("Failed to load predictive analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse">
        Loading Predictive Intelligence...
      </div>
    );
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="text-indigo-500" />
          Predictive Intelligence
        </h2>
        <button
          onClick={loadData}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-sm">Predicted Threats</span>
            <AlertCircle size={16} className="text-red-500" />
          </div>
          <div className="text-2xl font-bold">{stats.predictedFraud}</div>
          <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <TrendingUp size={12} /> +2 from yesterday
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-slate-500 text-sm">Model Accuracy</span>
            <Activity size={16} className="text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats.accuracy}%</div>
          <div className="text-xs text-green-500 mt-1">Operating nominally</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm h-64">
        <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">
          7-Day Risk Forecast
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats.riskTrend}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="date"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: "#6366f1", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PredictiveDashboard;
