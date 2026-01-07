import React, { useState } from "react";
import {
  FileText,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";
import { secureLogger } from "@/utils/secureLogger";

interface AgentDraft {
  id: string;
  title: string;
  description: string;
  type: "SAR" | "FREEZE" | "CLEANUP" | "INVESTIGATION";
  impact: "critical" | "high" | "medium" | "low";
  confidence: number;
  reasoning: string;
  timestamp: string;
  status: "pending" | "applied" | "rejected";
}

const AgentDrafts: React.FC = () => {
  const [drafts, setDrafts] = useState<AgentDraft[]>([
    {
      id: "d-1",
      title: "Draft Suspicious Activity Report (SAR)",
      description:
        "Auto-populated SAR reflecting unusual wire activity from high-risk jurisdiction.",
      type: "SAR",
      impact: "high",
      confidence: 0.94,
      reasoning:
        "Transaction velocity exceeds baseline by 400% in a 12-hour window.",
      timestamp: "2025-12-20T08:00:00Z",
      status: "pending",
    },
    {
      id: "d-2",
      title: "Beneficiary Account Freeze Recommendation",
      description:
        "Administrative hold on account ending in *4429 due to suspected fraud sweep.",
      type: "FREEZE",
      impact: "critical",
      confidence: 0.88,
      reasoning:
        "Multiple failed MFA attempts followed by attempt to transfer total balance.",
      timestamp: "2025-12-20T09:15:00Z",
      status: "pending",
    },
    {
      id: "d-3",
      title: "Entity Linkage Investigation",
      description:
        "Deep scan for secondary connections between Subject A and known associates.",
      type: "INVESTIGATION",
      impact: "medium",
      confidence: 0.72,
      reasoning:
        "Shared IP address detected across three unrelated corporate accounts.",
      timestamp: "2025-12-20T10:30:00Z",
      status: "pending",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "critical":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "medium":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "SAR":
        return <FileText className="w-5 h-5" />;
      case "FREEZE":
        return <ShieldAlert className="w-5 h-5" />;
      case "CLEANUP":
        return <Trash2 className="w-5 h-5" />;
      case "INVESTIGATION":
        return <Search className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const handleAction = (id: string, action: "apply" | "reject") => {
    secureLogger.info("AGENT_DRAFTS", `Draft ${id} ${action}ed`);
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: action === "apply" ? "applied" : "rejected" }
          : d,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 pt-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-semibold tracking-wider uppercase">
                AI Agent Intelligence
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Agent Drafts & Proposals
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl text-lg">
              Review and adjudicate autonomous agent proposals. Actions require
              human oversight before execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search drafts..."
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Filter className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </header>

        <div className="grid gap-6">
          {drafts
            .filter(
              (d) =>
                d.status === "pending" &&
                d.title.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .map((draft) => (
              <div
                key={draft.id}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Left Accent */}
                  <div
                    className={`w-1.5 shrink-0 ${
                      draft.impact === "critical"
                        ? "bg-red-500"
                        : draft.impact === "high"
                          ? "bg-orange-500"
                          : "bg-indigo-500"
                    }`}
                  />

                  <div className="flex-1 p-6 flex flex-col md:flex-row gap-6">
                    {/* Icon & Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-xl ${getImpactColor(draft.impact)}`}
                          >
                            {getIcon(draft.type)}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                              {draft.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(draft.timestamp).toLocaleTimeString()}
                              </span>
                              <span>•</span>
                              <span className="font-medium text-emerald-500">
                                {Math.round(draft.confidence * 100)}% AI
                                Confidence
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                        {draft.description}
                      </p>

                      <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-800/50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                          AI Reasoning
                        </span>
                        <p className="text-sm italic text-slate-700 dark:text-slate-300">
                          "{draft.reasoning}"
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col justify-end gap-3 shrink-0">
                      <button
                        onClick={() => handleAction(draft.id, "apply")}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve & Execute
                      </button>
                      <button
                        onClick={() => handleAction(draft.id, "reject")}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        Discard
                      </button>
                      <button className="flex items-center justify-center gap-2 px-6 py-2.5 text-slate-500 hover:text-indigo-500 transition-colors text-sm font-medium">
                        Review Details
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {drafts.filter((d) => d.status === "pending").length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Queue Discharged</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center max-w-xs">
              No pending agent drafts at this time. All autonomous proposals
              have been processed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDrafts;
