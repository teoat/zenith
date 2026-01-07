import SuccessBanner from "./SuccessBanner";
import KeyFindings from "./KeyFindings";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const SummaryPreview = () => {
  const caseId = "CASE-492";

  const findings = [
    {
      id: "1",
      type: "pattern",
      severity: "high",
      description:
        "Identified 15 high-risk mirroring patterns involving 3 entities.",
    },
    {
      id: "2",
      type: "amount",
      severity: "high",
      description: "Total flagged amount: $4.8M across 47 transactions.",
    },
    {
      id: "3",
      type: "confirmation",
      severity: "medium",
      description:
        "3 confirmed fraudulent transactions referred to authorities.",
    },
    {
      id: "4",
      type: "recommendation",
      severity: "medium",
      description: "Recommended enhanced monitoring for 2 vendor accounts.",
    },
  ];

  const chartData = [
    { name: "Jan", risk: 4000 },
    { name: "Feb", risk: 3000 },
    { name: "Mar", risk: 2000 },
    { name: "Apr", risk: 2780 },
    { name: "May", risk: 1890 },
    { name: "Jun", risk: 2390 },
  ];

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 max-w-5xl mx-auto">
      <SuccessBanner
        status="success"
        dataQuality={99.8}
        daysToResolution={45}
        caseId={caseId}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <KeyFindings findings={findings as any[]} caseId={caseId} />

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">
              Transaction Risk Volume
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#334155"
                    opacity={0.3}
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      color: "#f8fafc",
                    }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar dataKey="risk" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Executive Metrics
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Ingestion</span>
                  <span className="font-medium text-green-600">Complete</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full w-full"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Reconciliation</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    94% Match
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[94%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Adjudication</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    98 Resolved
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-[98%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 p-5">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 border-b border-blue-200 dark:border-blue-800/30 pb-2 mb-3">
              Next Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium hover:border-blue-400 dark:hover:border-blue-700 transition-colors">
                Generate PDF Report
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium hover:border-blue-400 dark:hover:border-blue-700 transition-colors">
                Archive Case
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPreview;
