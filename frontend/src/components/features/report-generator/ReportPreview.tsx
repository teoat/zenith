import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ReportSection, CaseData } from '@/types/report-generator';

interface ReportPreviewProps {
  sections: ReportSection[];
  title: string;
  caseData: CaseData;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  sections,
  title,
  caseData
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
      <ScrollArea className="h-[700px]">
        <div className="p-12 max-w-[800px] mx-auto space-y-12">
          {/* Document Header */}
          <div className="text-center space-y-4 pb-12 border-b-2 border-slate-100">
             <div className="bg-slate-900 text-white inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                OFFICIAL INVESTIGATION RECORD
             </div>
             <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h1>
             <div className="flex justify-center gap-8 text-sm text-slate-500 font-bold uppercase tracking-wider pt-2">
                <span>Ref: {caseData.caseId}</span>
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Status: Confidential</span>
             </div>
          </div>

          {/* Render Sections */}
          {sections.map(section => (
            <div key={section.id} className="space-y-4">
               <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider underline decoration-blue-600 decoration-4 underline-offset-8">
                     {section.title}
                  </h2>
                  {section.wordCount && (
                     <Badge variant="outline" className="font-bold text-[10px] opacity-50">
                        {section.wordCount} WORDS
                     </Badge>
                  )}
               </div>

               {section.status === 'generating' ? (
                  <div className="p-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-100">
                     <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synthesizing data...</span>
                  </div>
               ) : section.status === 'error' ? (
                  <div className="p-12 bg-red-50 dark:bg-red-900/10 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed border-red-100">
                     <AlertTriangle className="w-6 h-6 text-red-600" />
                     <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Generation failed</span>
                  </div>
               ) : (
                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap pl-4 border-l-4 border-slate-100">
                     {section.content}
                  </div>
               )}
            </div>
          ))}

          {sections.length === 0 && (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-300">
               <Loader2 className="w-12 h-12 mb-4 opacity-10" />
               <p className="font-black uppercase tracking-widest opacity-20">Preview area empty</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
