import React from 'react';
import { Download, FileText, Globe, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReportSection } from '@/types/report-generator';

interface ReportExportPanelProps {
  sections: ReportSection[];
  onExport: (format: 'pdf' | 'docx' | 'html') => void;
}

export const ReportExportPanel: React.FC<ReportExportPanelProps> = ({
  sections,
  onExport
}) => {
  const completedSections = sections.filter(s => s.status === 'complete');
  const totalWords = completedSections.reduce((sum, s) => sum + (s.wordCount || 0), 0);

  return (
    <div className="space-y-12 py-12">
      <div className="text-center space-y-4">
         <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Export Finished Record</h3>
         <p className="text-slate-500 font-medium">Select your preferred format for official submission</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1000px] mx-auto">
         <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-center gap-6 group hover:border-blue-200 transition-all">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl text-red-600 group-hover:scale-110 transition-transform">
               <FileText className="w-8 h-8" />
            </div>
            <div className="text-center">
               <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">PDF Legacy</h4>
               <p className="text-[10px] text-slate-400 font-bold mt-1">FOR OFFICIAL FILING</p>
            </div>
            <Button onClick={() => onExport('pdf')} className="w-full bg-slate-900 hover:bg-black font-black uppercase text-xs tracking-widest h-12">
               Download PDF
            </Button>
         </div>

         <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-center gap-6 group hover:border-blue-200 transition-all">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
               <BookOpen className="w-8 h-8" />
            </div>
            <div className="text-center">
               <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Word Draft</h4>
               <p className="text-[10px] text-slate-400 font-bold mt-1">FOR FURTHER EDITING</p>
            </div>
            <Button onClick={() => onExport('docx')} className="w-full bg-slate-900 hover:bg-black font-black uppercase text-xs tracking-widest h-12">
               Download DOCX
            </Button>
         </div>

         <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-center gap-6 group hover:border-blue-200 transition-all">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
               <Globe className="w-8 h-8" />
            </div>
            <div className="text-center">
               <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">HTML Web</h4>
               <p className="text-[10px] text-slate-400 font-bold mt-1">FOR SECURE PORTAL</p>
            </div>
            <Button onClick={() => onExport('html')} className="w-full bg-slate-900 hover:bg-black font-black uppercase text-xs tracking-widest h-12">
               Download HTML
            </Button>
         </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 max-w-[600px] mx-auto flex justify-around items-center border border-white/10">
         <div className="text-center">
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Final Count</div>
            <div className="text-2xl font-black text-white">{totalWords.toLocaleString()} <span className="text-sm font-medium text-slate-500">WORDS</span></div>
         </div>
         <div className="h-8 w-[1px] bg-white/10" />
         <div className="text-center">
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Architecture</div>
            <div className="text-2xl font-black text-white">{completedSections.length} <span className="text-sm font-medium text-slate-500">SECTIONS</span></div>
         </div>
      </div>
    </div>
  );
};
