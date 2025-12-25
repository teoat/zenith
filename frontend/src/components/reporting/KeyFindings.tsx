import React, { useState } from 'react';
import { Edit2, Shield, AlertTriangle, Check, DollarSign, Brain } from 'lucide-react';

interface Finding {
  id: string;
  type: 'pattern' | 'amount' | 'confirmation' | 'false_positive' | 'recommendation';
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface KeyFindingsProps {
  findings: Finding[];
  caseId: string;
  editable?: boolean;
}

const KeyFindings: React.FC<KeyFindingsProps> = ({ findings, editable = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localFindings, setLocalFindings] = useState(findings);

  const getIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <Brain size={16} className="text-purple-500" />;
      case 'amount': return <DollarSign size={16} className="text-green-500" />;
      case 'confirmation': return <Check size={16} className="text-blue-500" />;
      case 'recommendation': return <Shield size={16} className="text-indigo-500" />;
      default: return <AlertTriangle size={16} className="text-slate-500" />;
    }
  };

  const handleChange = (id: string, value: string) => {
    setLocalFindings(prev => prev.map(f => f.id === id ? { ...f, description: value } : f));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Brain size={18} className="text-blue-600" />
          AI Key Findings
        </h3>
        {editable && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              isEditing 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isEditing ? <Check size={16} /> : <Edit2 size={16} />}
            {isEditing ? 'Done Editing' : 'Edit Summary'}
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {localFindings.map((finding) => (
          <div key={finding.id} className="flex gap-3 items-start group">
            <div className="mt-1 flex-shrink-0">
              {getIcon(finding.type)}
            </div>
            {isEditing ? (
              <textarea
                value={finding.description}
                onChange={(e) => handleChange(finding.id, e.target.value)}
                className="flex-1 p-2 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {finding.description}
              </p>
            )}
            
            <div className={`
              px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0
              ${finding.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                finding.severity === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}
            `}>
              {finding.severity}
            </div>
          </div>
        ))}
        
        {localFindings.length === 0 && (
          <p className="text-center text-slate-500 py-8 italic">No findings generated yet.</p>
        )}
      </div>
    </div>
  );
};

export default KeyFindings;
