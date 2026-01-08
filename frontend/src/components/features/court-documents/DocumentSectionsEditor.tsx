import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocumentSection } from '@/types/court-documents';
import { sectionTemplates } from './templates';

interface DocumentSectionsEditorProps {
  sections: DocumentSection[];
  onUpdate: (id: string, content: string) => void;
}

export const DocumentSectionsEditor: React.FC<DocumentSectionsEditorProps> = ({
  sections,
  onUpdate
}) => {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold uppercase tracking-wider text-slate-500">Document Content</Label>
      <ScrollArea className="h-[500px] pr-4 border rounded-xl bg-slate-50 p-4">
        <div className="space-y-6">
          {sections.map(section => (
            <div key={section.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                 <h4 className="text-sm font-bold text-slate-900">{section.title}</h4>
                 <span className="text-[10px] font-mono text-slate-400">#{section.id}</span>
              </div>
              <Textarea
                value={section.content}
                onChange={(e) => onUpdate(section.id, e.target.value)}
                placeholder={sectionTemplates[section.id]?.placeholder || 'Enter content specific to this section...'}
                className="min-h-[120px] resize-none focus-visible:ring-blue-500 border-none shadow-none font-serif text-[15px] leading-relaxed p-0"
              />
            </div>
          ))}
          {sections.length === 0 && (
            <div className="py-12 text-center text-slate-400 italic">
               Select a document type to start editing sections.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
