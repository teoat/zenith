import React, { useState, useEffect, useCallback } from "react";
import {
  Eye,
  ThumbsUp,
  ThumbsDown,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { secureLogger } from "@/utils/secureLogger";

interface Insight {
  id: string;
  title: string;
  message: string;
  confidence: number;
  type: "pattern" | "anomaly" | "suggestion";
}

const AIWatchtower: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);

  // Fetch insights from backend
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const rawInsights = await api.getAIInsights();
        setInsights(
          rawInsights.map((i) => ({
            id: i.id,
            title:
              i.message.substring(0, 30) + (i.message.length > 30 ? "..." : ""),
            message: i.message,
            confidence: Math.round(i.confidence * 100),
            type: (i.type as "pattern" | "anomaly" | "suggestion") || "anomaly",
          })),
        );
      } catch (error) {
        secureLogger.error("Failed to load AI insights", error);
      }
    };
    fetchInsights();
    // Poll every 30 seconds
    const interval = setInterval(fetchInsights, 30000);
    return () => clearInterval(interval);
  }, []);

  const removeInsight = useCallback((id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleFeedback = useCallback(
    async (insightId: string, isPositive: boolean) => {
      try {
        await api.sendAIFeedback(insightId, isPositive);
        secureLogger.info(`Feedback sent for ${insightId}`);
      } catch (e) {
        secureLogger.error(e);
      }
    },
    [],
  );

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl shadow-lg border border-indigo-500/30 overflow-hidden h-full">
      <div className="p-4 border-b border-indigo-500/30 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={20} />
          AI Watchtower
        </h3>
        <span className="text-xs bg-indigo-500/20 text-indigo-200 px-2 py-1 rounded border border-indigo-500/30">
          Beta
        </span>
      </div>

      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-indigo-300/50">
            <Eye size={48} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">No new insights right now.</p>
          </div>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 relative group hover:border-indigo-400/50 transition-colors"
            >
              <button
                onClick={() => removeInsight(insight.id)}
                className="absolute top-2 right-2 text-white/30 hover:text-white hover:bg-white/10 rounded p-1"
                aria-label="Dismiss insight"
              >
                <X size={14} />
              </button>

              <div className="flex justify-between items-start mb-2 pr-6">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    insight.type === "pattern"
                      ? "bg-red-500/20 text-red-300"
                      : insight.type === "anomaly"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {insight.type}
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  {insight.confidence}% Conf
                </span>
              </div>

              <h4 className="font-bold text-sm mb-1">{insight.title}</h4>
              <p className="text-xs text-indigo-100/80 leading-relaxed mb-3">
                {insight.message}
              </p>

              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedback(insight.id, true)}
                    className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-green-400 transition"
                    aria-label="Mark as helpful"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    onClick={() => handleFeedback(insight.id, false)}
                    className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-red-400 transition"
                    aria-label="Mark as not helpful"
                  >
                    <ThumbsDown size={14} />
                  </button>
                </div>
                <button
                  className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 transition"
                  aria-label="Take action on this insight"
                >
                  Action <ExternalLink size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AIWatchtower;
