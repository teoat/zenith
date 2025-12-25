import React, { useState } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { GripVertical, ArrowRight, X } from 'lucide-react';

interface MappingConfig {
  [systemField: string]: string; // systemField: sourceColumn
}

interface DataMappingProps {
  sourceColumns: string[];
  previewData: any[];
  onMappingComplete: (mapping: MappingConfig) => void;
  onBack: () => void;
}

const SYSTEM_FIELDS = [
  { id: 'date', label: 'Transaction Date', required: true },
  { id: 'amount', label: 'Amount', required: true },
  { id: 'description', label: 'Description', required: true },
  { id: 'merchant', label: 'Merchant / Payee', required: false },
  { id: 'category', label: 'Category', required: false },
  { id: 'currency', label: 'Currency', required: false },
];

// Draggable Source Column Component
const SourceColumn = ({ id, label }: { id: string, label: string }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `source-${id}`,
    data: { type: 'source', value: id, label }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-3 mb-2 bg-white dark:bg-slate-800 border ${isDragging ? 'border-blue-500 opacity-50' : 'border-slate-200 dark:border-slate-700'} rounded shadow-sm cursor-move hover:border-blue-400 transition-colors`}
    >
      <GripVertical size={16} className="text-slate-400" />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{label}</span>
    </div>
  );
};

// Droppable Target Field Component
const TargetField = ({ field, mappedColumn, onRemove }: { field: any, mappedColumn: string | null, onRemove: () => void }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `target-${field.id}`,
    data: { fieldId: field.id }
  });

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[50px] p-2 rounded border-2 border-dashed transition-colors flex items-center ${
            mappedColumn 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
            : isOver 
                ? 'bg-blue-50 border-blue-400' 
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700'
        }`}
      >
        {mappedColumn ? (
          <div className="flex items-center justify-between w-full bg-white dark:bg-slate-800 p-2 rounded border border-blue-200 shadow-sm">
             <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{mappedColumn}</span>
             <button onClick={onRemove} className="text-slate-400 hover:text-red-500">
               <X size={14} />
             </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400 w-full text-center">Drop source column here</span>
        )}
      </div>
    </div>
  );
};

export const DataMapping: React.FC<DataMappingProps> = ({ sourceColumns, previewData, onMappingComplete, onBack }) => {
  const [mapping, setMapping] = useState<MappingConfig>({});
  const [activeDragItem, setActiveDragItem] = useState<any>(null);

  const handleDragStart = (event: any) => {
    setActiveDragItem(event.active.data.current);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (over && active.data.current?.type === 'source') {
        const targetId = over.id.replace('target-', '');
        const sourceLabel = active.data.current.label;
        
        setMapping(prev => ({
            ...prev,
            [targetId]: sourceLabel
        }));
    }
  };

  const removeMapping = (fieldId: string) => {
    const newMapping = { ...mapping };
    delete newMapping[fieldId];
    setMapping(newMapping);
  };

  const isValid = SYSTEM_FIELDS.filter(f => f.required).every(f => mapping[f.id]);

  return (
    <div className="flex flex-col h-full">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-6 min-h-0 overflow-hidden mb-6">
          {/* Source Columns */}
          <div className="w-1/3 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                Source Columns
                <span className="text-xs font-normal text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{sourceColumns.length}</span>
            </h3>
            <div className="overflow-y-auto flex-1 pr-2">
              {sourceColumns.map(col => (
                <SourceColumn key={col} id={col} label={col} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
             <ArrowRight className="text-slate-300" size={24} />
          </div>

          {/* Target Fields */}
          <div className="w-1/3 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">System Fields</h3>
            <div className="overflow-y-auto flex-1 pr-2">
              {SYSTEM_FIELDS.map(field => (
                <TargetField 
                    key={field.id} 
                    field={field} 
                    mappedColumn={mapping[field.id]} 
                    onRemove={() => removeMapping(field.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Live Preview */}
          <div className="w-1/3 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
             <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Mapping Preview</h3>
             <div className="overflow-x-auto">
                 <table className="min-w-full text-xs">
                     <thead>
                         <tr className="border-b border-slate-200 dark:border-slate-700">
                             {SYSTEM_FIELDS.map(f => (
                                 <th key={f.id} className="text-left py-2 px-2 font-medium text-slate-500">{f.label}</th>
                             ))}
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                         {previewData.slice(0, 12).map((row, idx) => (
                             <tr key={idx}>
                                {SYSTEM_FIELDS.map(f => {
                                    const mappedCol = mapping[f.id];
                                    const val = mappedCol ? row[mappedCol] : '-';
                                    return <td key={f.id} className="py-2 px-2 text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{val}</td>
                                })}
                             </tr>
                         ))}
                     </tbody>
                 </table>
                 {previewData.length === 0 && (
                     <p className="text-slate-400 text-center py-8 italic">No preview data available</p>
                 )}
             </div>
          </div>
        </div>

        <DragOverlay>
           {activeDragItem ? (
                <div className="p-3 bg-blue-600 text-white rounded shadow-lg opacity-90 w-[200px] truncate">
                    {activeDragItem.label}
                </div>
           ) : null}
        </DragOverlay>
      </DndContext>

      <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
        <button 
            onClick={onBack}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
        >
            Back
        </button>
        <button 
            onClick={() => onMappingComplete(mapping)}
            disabled={!isValid}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
            Next: Review
        </button>
      </div>
    </div>
  );
};
