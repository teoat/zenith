import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Power,
  PowerOff,
  Save,
  AlertTriangle,
} from "lucide-react";
import { secureLogger } from "@/utils/secureLogger";

interface Rule {
  rule_id: string;
  name: string;
  description: string;
  rule_type:
    | "velocity"
    | "amount"
    | "geographic"
    | "pattern"
    | "time"
    | "account";
  risk_level: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  triggered_count: number;
  created_at: string;
}

interface FraudRuleBuilderProps {
  onRuleCreated?: (rule: Rule) => void;
  onRuleDeleted?: (ruleId: string) => void;
}

export const FraudRuleBuilder: React.FC<FraudRuleBuilderProps> = ({
  onRuleCreated,
  onRuleDeleted,
}) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRule, setNewRule] = useState<{
    rule_type:
      | "velocity"
      | "amount"
      | "geographic"
      | "pattern"
      | "time"
      | "account";
    name: string;
    description: string;
    risk_level: "low" | "medium" | "high" | "critical";
    parameters: any;
  }>({
    rule_type: "velocity",
    name: "",
    description: "",
    risk_level: "medium",
    parameters: {},
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const response = await fetch("/api/v1/fraud/rules");
      const data = await response.json();
      setRules(data.rules || []);
    } catch (error) {
      secureLogger.error("Failed to load rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string) => {
    try {
      await fetch(`/api/v1/fraud/rules/${ruleId}/toggle`, { method: "PATCH" });
      await loadRules();
    } catch (error) {
      secureLogger.error("Failed to toggle rule:", error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      await fetch(`/api/v1/fraud/rules/${ruleId}`, { method: "DELETE" });
      await loadRules();
      onRuleDeleted?.(ruleId);
    } catch (error) {
      secureLogger.error("Failed to delete rule:", error);
    }
  };

  const createRule = async () => {
    try {
      const response = await fetch("/api/v1/fraud/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRule),
      });

      if (response.ok) {
        const data = await response.json();
        await loadRules();
        setShowCreateModal(false);
        setNewRule({
          rule_type: "velocity",
          name: "",
          description: "",
          risk_level: "medium",
          parameters: {},
        });
        onRuleCreated?.(data.rule);
      }
    } catch (error) {
      secureLogger.error("Failed to create rule:", error);
    }
  };

  const getRuleTypeColor = (type: string) => {
    const colors = {
      velocity: "bg-blue-100 text-blue-700",
      amount: "bg-green-100 text-green-700",
      geographic: "bg-purple-100 text-purple-700",
      pattern: "bg-amber-100 text-amber-700",
      time: "bg-cyan-100 text-cyan-700",
      account: "bg-pink-100 text-pink-700",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  const getRiskLevelColor = (level: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-600",
      medium: "bg-amber-100 text-amber-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700",
    };
    return colors[level as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return <div className="p-6 text-center">Loading rules...</div>;
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Fraud Detection Rules
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure and manage fraud detection rules
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          Create Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.rule_id}
            className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {rule.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getRuleTypeColor(rule.rule_type)}`}
                  >
                    {rule.rule_type}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getRiskLevelColor(rule.risk_level)}`}
                  >
                    {rule.risk_level}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {rule.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>ID: {rule.rule_id}</span>
                  <span>Triggered: {rule.triggered_count} times</span>
                  <span>
                    Created: {new Date(rule.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRule(rule.rule_id)}
                  className={`p-2 rounded-lg transition-colors ${
                    rule.enabled
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  }`}
                  title={rule.enabled ? "Disable rule" : "Enable rule"}
                >
                  {rule.enabled ? <Power size={18} /> : <PowerOff size={18} />}
                </button>
                <button
                  onClick={() => deleteRule(rule.rule_id)}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  title="Delete rule"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <AlertTriangle size={48} className="mx-auto mb-4 text-slate-300" />
            <p>No fraud detection rules configured</p>
            <p className="text-sm mt-1">
              Create your first rule to get started
            </p>
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Create New Rule
            </h3>

            <div className="space-y-4">
              {/* Rule Type */}
              <div>
                <label
                  htmlFor="rule-type"
                  className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                >
                  Rule Type
                </label>
                <select
                  id="rule-type"
                  value={newRule.rule_type}
                  onChange={(e) =>
                    setNewRule({ ...newRule, rule_type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                >
                  <option value="velocity">
                    Velocity (Transaction Frequency)
                  </option>
                  <option value="amount">Amount Threshold</option>
                  <option value="geographic">Geographic Anomaly</option>
                </select>
              </div>

              {/* Risk Level */}
              <div>
                <label
                  htmlFor="risk-level"
                  className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                >
                  Risk Level
                </label>
                <select
                  id="risk-level"
                  value={newRule.risk_level}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      risk_level: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Type-specific parameters */}
              {newRule.rule_type === "velocity" && (
                <>
                  <div>
                    <label
                      htmlFor="max-transactions"
                      className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                    >
                      Max Transactions
                    </label>
                    <input
                      id="max-transactions"
                      type="number"
                      value={newRule.parameters.max_transactions || 5}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          parameters: {
                            ...newRule.parameters,
                            max_transactions: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="time-window"
                      className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                    >
                      Time Window (minutes)
                    </label>
                    <input
                      id="time-window"
                      type="number"
                      value={newRule.parameters.time_window_minutes || 5}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          parameters: {
                            ...newRule.parameters,
                            time_window_minutes: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                </>
              )}

              {newRule.rule_type === "amount" && (
                <div>
                  <label
                    htmlFor="threshold-amount"
                    className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                  >
                    Threshold Amount
                  </label>
                  <input
                    id="threshold-amount"
                    type="number"
                    value={newRule.parameters.threshold_amount || 10000}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        parameters: {
                          ...newRule.parameters,
                          threshold_amount: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={createRule}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Save size={18} />
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudRuleBuilder;
