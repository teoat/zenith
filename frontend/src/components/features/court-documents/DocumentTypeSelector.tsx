import React from 'react';
import { Scale } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DocumentType } from '@/types/court-documents';
import { documentTemplates } from './templates';
import { cn } from '@/lib/utils';

interface DocumentTypeSelectorProps {
  selectedType: DocumentType;
  onSelect: (type: DocumentType) => void;
}

export const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  selectedType,
  onSelect
}) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Document Type</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(documentTemplates).map(([type, config]) => (
          <button
            key={type}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border transition-all text-left group",
              selectedType === type
                ? "bg-blue-50 border-blue-200 ring-2 ring-blue-100"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
            onClick={() => onSelect(type as DocumentType)}
          >
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              selectedType === type ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            )}>
              <Scale className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className={cn("text-sm font-bold truncate", selectedType === type ? "text-blue-900" : "text-slate-900")}>
                {config.name}
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {config.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
