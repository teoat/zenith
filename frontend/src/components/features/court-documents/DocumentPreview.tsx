import React from 'react';
import { Download, ChevronLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LegalDocument } from '@/types/court-documents';

interface DocumentPreviewProps {
  document: LegalDocument;
  caseName: string;
  onBack: () => void;
  onExport: (format: 'pdf' | 'docx') => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  caseName,
  onBack,
  onExport
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-600 font-bold hover:bg-slate-50">
          <ChevronLeft className="w-4 h-4" />
          Back to Editor
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 bg-white">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onExport('pdf')} 
            className="gap-2 bg-white"
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
          <Button 
             variant="default" 
             size="sm" 
             onClick={() => onExport('docx')} 
             className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            DOCX
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-8">
        <div className="mx-auto max-w-[800px] bg-white shadow-2xl p-16 font-serif text-[16px] text-black min-h-[1056px] leading-relaxed">
           <div className="text-center mb-12 space-y-2 border-b-2 border-slate-100 pb-8">
              <h1 className="text-2xl font-black uppercase tracking-widest">{document.title}</h1>
              <div className="h-0.5 w-24 bg-blue-600 mx-auto opacity-50" />
              <p className="font-bold text-lg mt-4">{caseName}</p>
              <p className="text-slate-600 italic">Case Number: {document.caseNumber}</p>
           </div>

           <div className="space-y-10">
              {document.sections.map(section => (
                <div key={section.id} className="space-y-4">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-l-4 border-blue-500 pl-3">
                    {section.title}
                  </h2>
                  <div className="whitespace-pre-wrap pl-4 text-justify">
                    {section.content || (
                      <span className="text-slate-300 italic">[Content pending for this section]</span>
                    )}
                  </div>
                </div>
              ))}

              {document.exhibits.length > 0 && (
                <div className="space-y-6 pt-10 mt-10 border-t border-slate-100">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 border-l-4 border-emerald-500 pl-3">
                    INDEX OF EXHIBITS
                  </h2>
                  <div className="grid grid-cols-1 gap-2 pl-4">
                    {document.exhibits.map(ex => (
                      <div key={ex.id} className="flex gap-4 items-start">
                        <span className="font-bold min-w-[100px] text-blue-700">{ex.label}:</span>
                        <span className="text-slate-700">{ex.description || '(No description)'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="signature-block pt-16 mt-16 space-y-8">
                 <p className="font-medium">Respectfully submitted,</p>
                 <div className="w-64 h-[1px] bg-black" />
                 <div>
                    <p className="font-bold">[NAME]</p>
                    <p className="text-sm text-slate-500">Counsel for [PARTY]</p>
                    <p className="text-sm text-slate-500">Date: {new Date(document.generatedAt).toLocaleDateString()}</p>
                 </div>
              </div>
           </div>
        </div>
      </ScrollArea>
    </div>
  );
};
