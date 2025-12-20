import React, { useState } from 'react';
import { Plus, Trash2, Save, Play, AlertTriangle, Check, Layers } from 'lucide-react';

interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const FIELDS = [
  { value: 'amount', label: 'Transaction Amount' },
  { value: 'frequency', label: 'Transaction Frequency' },
  { value: 'risk_score', label: 'Risk Score' },
  { value: 'country', label: 'Country' },
  { value: 'account_age', label: 'Account Age (days)' },
  { value: 'velocity', label: 'Velocity (txn/hour)' },
];

const OPERATORS = [
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: '>=', label: 'Greater or equal' },
  { value: '<=', label: 'Less or equal' },
  { value: '==', label: 'Equals' },
  { value: '!=', label: 'Not equals' },
  { value: 'in', label: 'In list' },
  { value: 'not_in', label: 'Not in list' },
];

const RuleBuilder: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([
    { id: '1', field: 'amount', operator: '>', value: '10000' },
    { id: '2', field: 'risk_score', operator: '>=', value: '75' },
  ]);
  const [combinator, setCombinator] = useState<'AND' | 'OR'>('AND');
  const [ruleName, setRuleName] = useState('High Value Suspicious Transaction');
  const [testResult, setTestResult] = useState<'pass' | 'fail' | null>(null);

  const addRule = () => {
    setRules([...rules, { id: Date.now().toString(), field: 'amount', operator: '>', value: '' }]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const updateRule = (id: string, field: keyof Rule, value: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const testRule = () => {
    // Simulate rule testing
    setTestResult(null);
    setTimeout(() => {
      setTestResult(Math.random() > 0.3 ? 'pass' : 'fail');
    }, 500);
  };

  const getQueryPreview = () => {
    return rules.map(r => `${r.field} ${r.operator} ${r.value}`).join(` ${combinator} `);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold flex items-center gap-2 mb-3">
          <Layers size={20} className="text-indigo-500" />
          Rule Builder
        </h3>
        <input
          type="text"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          placeholder="Rule name..."
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {/* Combinator */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Match</span>
          <select
            value={combinator}
            onChange={(e) => setCombinator(e.target.value as 'AND' | 'OR')}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800"
          >
            <option value="AND">ALL conditions (AND)</option>
            <option value="OR">ANY condition (OR)</option>
          </select>
        </div>
      </div>

      {/* Rules */}
      <div className="p-4 space-y-3">
        {rules.map((rule, index) => (
          <div key={rule.id} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="text-xs font-bold text-slate-400 w-6 text-center">{index + 1}</span>
            
            <select
              value={rule.field}
              onChange={(e) => updateRule(rule.id, 'field', e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900"
            >
              {FIELDS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            <select
              value={rule.operator}
              onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
              className="w-40 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900"
            >
              {OPERATORS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <input
              type="text"
              value={rule.value}
              onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
              placeholder="Value..."
              className="w-32 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900"
            />

            <button
              onClick={() => removeRule(rule.id)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg"
              aria-label="Remove rule"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button
          onClick={addRule}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
        >
          <Plus size={16} />
          Add Condition
        </button>
      </div>

      {/* Preview */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-black">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-slate-500">QUERY PREVIEW</span>
        </div>
        <code className="text-xs text-green-400 font-mono break-all">
          {getQueryPreview() || '<empty rule>'}
        </code>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
        <button
          onClick={testRule}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm font-medium"
        >
          <Play size={14} />
          Test Rule
        </button>
        
        {testResult && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            testResult === 'pass' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}>
            {testResult === 'pass' ? <Check size={14} /> : <AlertTriangle size={14} />}
            {testResult === 'pass' ? '24 matches found' : 'Syntax error'}
          </div>
        )}

        <div className="flex-1" />

        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold">
          <Save size={14} />
          Save Rule
        </button>
      </div>
    </div>
  );
};

export default RuleBuilder;
