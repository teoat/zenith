import React from "react";
import type { AlertItem } from "@/lib/api";
import { Clock, ExternalLink } from "lucide-react";

interface HistoryTabProps {
  alert: AlertItem;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ alert: _alert }) => {
  // Mock history
  const history = [
    {
      id: "alert_prev_1",
      date: "2023-10-20",
      type: "velocity_anomaly",
      decision: "approved",
      user: "Agent Smith",
    },
    {
      id: "alert_prev_2",
      date: "2023-09-15",
      type: "structuring",
      decision: "rejected",
      user: "System",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">
        Alert History
      </h3>

      <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6 pl-6 py-2">
        {history.map((item, i) => (
          <div key={i} className="relative">
            <div
              className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${item.decision === "approved" ? "bg-green-500" : "bg-red-500"}`}
            ></div>

            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  {item.type.replace("_", " ")}
                  <button
                    type="button"
                    className="text-slate-400 hover:text-blue-500"
                  >
                    <ExternalLink size={12} />
                  </button>
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Clock size={12} />
                  {item.date}
                  <span>•</span>
                  <span>by {item.user}</span>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${item.decision === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {item.decision}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryTab;
