import React, { memo } from 'react';
import { X, Edit3, Trash2, Link2, User, Building, CreditCard, Globe, Calendar, Tag, ExternalLink } from 'lucide-react';

interface NodeInspectorProps {
  node: {
    id: string;
    label: string;
    type: 'person' | 'company' | 'account' | 'ip' | 'location';
    properties?: Record<string, any>;
    connections?: number;
  } | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const NodeInspector: React.FC<NodeInspectorProps> = memo(({ node, onClose, onEdit, onDelete }) => {
  if (!node) return null;

  const getTypeIcon = () => {
    switch (node.type) {
      case 'person': return <User size={20} className="text-blue-500" />;
      case 'company': return <Building size={20} className="text-amber-500" />;
      case 'account': return <CreditCard size={20} className="text-emerald-500" />;
      case 'ip': return <Globe size={20} className="text-indigo-500" />;
      case 'location': return <Globe size={20} className="text-red-500" />;
    }
  };

  const getTypeColor = () => {
    switch (node.type) {
      case 'person': return 'bg-blue-100 dark:bg-blue-900/30';
      case 'company': return 'bg-amber-100 dark:bg-amber-900/30';
      case 'account': return 'bg-emerald-100 dark:bg-emerald-900/30';
      case 'ip': return 'bg-indigo-100 dark:bg-indigo-900/30';
      case 'location': return 'bg-red-100 dark:bg-red-900/30';
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getTypeColor()}`}>
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{node.label}</h3>
            <span className="text-xs uppercase text-slate-500 font-medium">{node.type}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" aria-label="Close inspector">
          <X size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{node.connections || 0}</div>
            <div className="text-xs text-slate-500">Connections</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-amber-600">3</div>
            <div className="text-xs text-slate-500">Flags</div>
          </div>
        </div>

        {/* Properties */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
            <Tag size={12} /> Properties
          </h4>
          <div className="space-y-2">
            {node.properties && Object.entries(node.properties).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{String(value)}</span>
              </div>
            ))}
            {(!node.properties || Object.keys(node.properties).length === 0) && (
              <p className="text-sm text-slate-400 italic">No properties defined</p>
            )}
          </div>
        </div>

        {/* Related Documents */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
            <Link2 size={12} /> Linked Evidence
          </h4>
          <div className="space-y-2">
            <button className="flex w-full items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group text-left">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center text-xs font-bold text-red-600">PDF</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-blue-600">Bank_Statement.pdf</p>
                <p className="text-xs text-slate-400">Evidence #881</p>
              </div>
              <ExternalLink size={14} className="text-slate-400 opacity-0 group-hover:opacity-100" />
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
            <Calendar size={12} /> Activity
          </h4>
          <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-700 ml-1">
            <div className="pl-4 relative">
              <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900"></div>
              <p className="text-xs text-slate-500">Today</p>
              <p className="text-sm">Added to Case #492</p>
            </div>
            <div className="pl-4 relative">
              <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-300 rounded-full border-2 border-white dark:border-slate-900"></div>
              <p className="text-xs text-slate-500">Dec 5</p>
              <p className="text-sm">Entity created</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
        <button 
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Edit3 size={14} /> Edit
        </button>
        <button 
          onClick={onDelete}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
          aria-label="Delete entity"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
});

NodeInspector.displayName = 'NodeInspector';

export default NodeInspector;
