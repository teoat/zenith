import React from 'react';
import { Settings, Wand2, Building, Users, FileText, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { ReportTemplate, CaseData } from '@/types/report-generator';

interface ReportConfigPanelProps {
  templates: ReportTemplate[];
  selectedTemplate: string;
  onTemplateSelect: (id: string) => void;
  reportTitle: string;
  onTitleChange: (val: string) => void;
  selectedSections: Set<string>;
  onToggleSection: (id: string) => void;
  customInstructions: string;
  onInstructionsChange: (val: string) => void;
  caseData: CaseData;
  isGenerating: boolean;
  progress: number;
  onGenerate: () => void;
  sectionConfig: Record<string, any>;
}

export const ReportConfigPanel: React.FC<ReportConfigPanelProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  reportTitle,
  onTitleChange,
  selectedSections,
  onToggleSection,
  customInstructions,
  onInstructionsChange,
  caseData,
  isGenerating,
  progress,
  onGenerate,
  sectionConfig
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Configuration */}
        <div className="space-y-6">
          <div className="space-y-4">
             <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Report Template</Label>
             <div className="grid grid-cols-2 gap-3">
               {templates.map(tmpl => (
                 <button
                   key={tmpl.id}
                   onClick={() => onTemplateSelect(tmpl.id)}
                   className={`p-4 rounded-xl border-2 text-left transition-all ${
                     selectedTemplate === tmpl.id 
                       ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50' 
                       : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                   }`}
                 >
                   <div className={`text-sm font-black ${selectedTemplate === tmpl.id ? 'text-blue-700' : 'text-slate-900 dark:text-white'}`}>{tmpl.name}</div>
                   <div className="text-[10px] text-slate-500 font-medium mt-1 line-clamp-1">{tmpl.description}</div>
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Main Title</Label>
            <Input 
              value={reportTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="bg-slate-50 border-none h-12 text-lg font-bold"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Sections To Synthesize</Label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(sectionConfig).map(([id, config]: [string, any]) => (
                <div key={id} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <Checkbox 
                    id={id} 
                    checked={selectedSections.has(id)} 
                    onCheckedChange={() => onToggleSection(id)}
                  />
                  <label htmlFor={id} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <config.icon className="w-3.5 h-3.5" />
                    {config.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Case Summary & Generation */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-6 shadow-2xl">
              <div className="flex justify-between items-start">
                 <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Source Context</div>
                    <h4 className="text-xl font-black">{caseData.caseId}</h4>
                 </div>
                 <div className="bg-blue-600 p-2 rounded-lg">
                    <Building className="w-4 h-4" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-1">
                       <Users className="w-3 h-3" /> Subjects
                    </div>
                    <div className="text-xl font-black">{caseData.subjects.length}</div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-1">
                       <FileText className="w-3 h-3" /> Evidence
                    </div>
                    <div className="text-xl font-black">{caseData.evidenceCount}</div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-1">
                       <DollarSign className="w-3 h-3" /> Total Value
                    </div>
                    <div className="text-xl font-black">${(caseData.transactionTotal / 1000000).toFixed(1)}M</div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase mb-1">
                       <AlertTriangle className="w-3 h-3" /> Alerts
                    </div>
                    <div className="text-xl font-black">{caseData.alertCount}</div>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                 <Label className="text-xs font-black uppercase tracking-widest text-slate-400">AI Context Modifiers</Label>
                 <Textarea 
                   value={customInstructions}
                   onChange={(e) => onInstructionsChange(e.target.value)}
                   placeholder="e.g. Focus on beneficial ownership connections..."
                   className="bg-white/5 border-white/10 text-xs min-h-[100px]"
                 />
              </div>

              <div className="space-y-4">
                 <Button 
                   onClick={onGenerate}
                   disabled={isGenerating || selectedSections.size === 0}
                   className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-black"
                 >
                   {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Synthesizing... {Math.round(progress)}%
                      </>
                   ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-3" />
                        Generate Report
                      </>
                   )}
                 </Button>
                 {isGenerating && <Progress value={progress} className="h-1 bg-white/10" />}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
