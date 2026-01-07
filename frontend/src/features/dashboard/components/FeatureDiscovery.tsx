import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Shield,
  Beaker,
  Activity,
  FileCheck,
  Layers,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  color: string;
  isNew?: boolean;
}

const advancedFeatures: Feature[] = [
  {
    id: "ai-lab",
    title: "AI Lab",
    description: "Run ML experiments and tune fraud detection models",
    path: "/ai-lab",
    icon: Beaker,
    color: "from-pink-500 to-rose-500",
    isNew: true,
  },
  {
    id: "advanced-compliance",
    title: "Advanced Compliance",
    description: "Enterprise-grade compliance monitoring and rule engine",
    path: "/advanced-compliance",
    icon: Shield,
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "predictive-maintenance",
    title: "Predictive Maintenance",
    description: "AI-powered failure prediction and self-healing",
    path: "/predictive-maintenance",
    icon: Zap,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "system-diagnostics",
    title: "System Diagnostics",
    description: "Real-time health monitoring and issue resolution",
    path: "/diagnostics/system",
    icon: Activity,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "code-review",
    title: "AI Code Review",
    description: "Automated security and quality analysis",
    path: "/code-review",
    icon: FileCheck,
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "orchestration",
    title: "System Orchestration",
    description: "Overall system health score and recommendations",
    path: "/orchestration",
    icon: Layers,
    color: "from-indigo-500 to-blue-500",
  },
];

interface FeatureDiscoveryProps {
  className?: string;
  maxItems?: number;
}

// Helper to get initial dismissed state from localStorage
const getInitialDismissed = (): boolean => {
  try {
    return localStorage.getItem("featureDiscoveryDismissed") === "true";
  } catch {
    return false;
  }
};

// Helper to get initial visited features from localStorage
const getInitialVisited = (): Set<string> => {
  try {
    const visited = localStorage.getItem("visitedFeatures");
    return visited ? new Set(JSON.parse(visited)) : new Set();
  } catch {
    return new Set();
  }
};

export const FeatureDiscovery: React.FC<FeatureDiscoveryProps> = ({
  className,
  maxItems = 4,
}) => {
  const [dismissed, setDismissed] = useState(getInitialDismissed);
  const [visitedFeatures, setVisitedFeatures] = useState(getInitialVisited);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("featureDiscoveryDismissed", "true");
  };

  const handleFeatureClick = (featureId: string) => {
    const newVisited = new Set(visitedFeatures);
    newVisited.add(featureId);
    setVisitedFeatures(newVisited);
    localStorage.setItem("visitedFeatures", JSON.stringify([...newVisited]));
  };

  // Filter out visited features and limit to maxItems
  const unvisitedFeatures = advancedFeatures
    .filter((f) => !visitedFeatures.has(f.id))
    .slice(0, maxItems);

  if (dismissed || unvisitedFeatures.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 relative overflow-hidden",
        className,
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Discover Advanced Features
            </h3>
            <p className="text-sm text-slate-400">
              Unlock the full power of the platform
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Dismiss feature discovery"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Feature Grid */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {unvisitedFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={feature.path}
                  onClick={() => handleFeatureClick(feature.id)}
                  className="group flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl transition-all"
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg bg-gradient-to-br",
                      feature.color,
                    )}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm group-hover:text-blue-400 transition-colors">
                        {feature.title}
                      </span>
                      {feature.isNew && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {feature.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {visitedFeatures.size > 0 && (
        <div className="relative mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {visitedFeatures.size} of {advancedFeatures.length} features
            explored
          </span>
          <div className="flex gap-1">
            {advancedFeatures.map((f) => (
              <div
                key={f.id}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  visitedFeatures.has(f.id) ? "bg-blue-500" : "bg-slate-700",
                )}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FeatureDiscovery;
