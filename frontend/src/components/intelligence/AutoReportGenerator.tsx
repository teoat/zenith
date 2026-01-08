/**
 * AutoReportGenerator - Phase 6G Advanced Intelligence
 * AI-powered investigation report generation
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Settings, Eye, Download, Book, Target, FileText, Clock, Scale, Users, AlertTriangle, Brain, CheckCircle } from 'lucide-react';

import { ReportSection, ReportTemplate, CaseData } from '@/types/report-generator';
import { ReportConfigPanel } from '../features/report-generator/ReportConfigPanel';
import { ReportPreview } from '../features/report-generator/ReportPreview';
import { ReportExportPanel } from '../features/report-generator/ReportExportPanel';

import './AutoReportGenerator.css';

const reportTemplates: ReportTemplate[] = [
  { id: 'sar', name: 'SAR Filing Report', description: 'Suspicious Activity Report format for regulatory filing', sections: ['executive_summary', 'subject_info', 'activity_description', 'supporting_documentation'], format: 'sar' },
  { id: 'internal', name: 'Internal Investigation', description: 'Comprehensive internal investigation report', sections: ['executive_summary', 'findings', 'evidence', 'timeline', 'recommendations'], format: 'internal' },
  { id: 'regulatory', name: 'Regulatory Response', description: 'Response to regulatory inquiry or examination', sections: ['executive_summary', 'factual_background', 'analysis', 'remediation'], format: 'regulatory' },
  { id: 'legal', name: 'Legal Brief', description: 'Court-ready legal documentation', sections: ['facts', 'legal_analysis', 'evidence_summary', 'conclusions'], format: 'legal' }
];

const sectionConfig = {
  executive_summary: { icon: Book, label: 'Executive Summary', estimatedWords: 300 },
  findings: { icon: Target, label: 'Key Findings', estimatedWords: 500 },
  evidence: { icon: FileText, label: 'Evidence Analysis', estimatedWords: 800 },
  timeline: { icon: Clock, label: 'Chronological Timeline', estimatedWords: 400 },
  recommendations: { icon: Scale, label: 'Recommendations', estimatedWords: 250 },
  subject_info: { icon: Users, label: 'Subject Information', estimatedWords: 350 },
  activity_description: { icon: AlertTriangle, label: 'Activity Description', estimatedWords: 600 },
  supporting_documentation: { icon: FileText, label: 'Supporting Documentation', estimatedWords: 200 },
  factual_background: { icon: Book, label: 'Factual Background', estimatedWords: 450 },
  analysis: { icon: Brain, label: 'Analysis', estimatedWords: 550 },
  remediation: { icon: CheckCircle, label: 'Remediation Steps', estimatedWords: 300 },
  facts: { icon: FileText, label: 'Statement of Facts', estimatedWords: 500 },
  legal_analysis: { icon: Scale, label: 'Legal Analysis', estimatedWords: 700 },
  evidence_summary: { icon: FileText, label: 'Evidence Summary', estimatedWords: 400 },
  conclusions: { icon: CheckCircle, label: 'Conclusions', estimatedWords: 250 }
};

export const AutoReportGenerator: React.FC<{ caseData?: CaseData; onExport?: (format: string) => void }> = ({ caseData, onExport }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('internal');
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set(['executive_summary', 'findings', 'evidence', 'timeline', 'recommendations']));
  const [reportTitle, setReportTitle] = useState('Investigation Report');

  const defaultCaseData: CaseData = useMemo(() => caseData || {
    caseId: 'CASE-2024-001',
    title: 'Suspicious Transaction Network Investigation',
    subjects: [{ name: 'Shell Corporation Alpha', type: 'company', riskScore: 92 }, { name: 'John Doe', type: 'person', riskScore: 85 }],
    evidenceCount: 47,
    transactionTotal: 2500000,
    alertCount: 12
  }, [caseData]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    const sectionsToGenerate = Array.from(selectedSections);
    const results: ReportSection[] = [];

    for (let i = 0; i < sectionsToGenerate.length; i++) {
        const type = sectionsToGenerate[i];
        setSections(prev => [...prev.filter(s => s.id !== type), { id: type, title: sectionConfig[type as keyof typeof sectionConfig]?.label || type, type: type as any, content: '', status: 'generating' }]);
        
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000)); // Simulate AI
        const content = `[AI GENERATED] Detailed analysis for ${type} regarding ${defaultCaseData.caseId}. Findings indicate high correlation between subjects and offshore entities.`;
        
        const completed: ReportSection = { id: type, title: sectionConfig[type as keyof typeof sectionConfig]?.label || type, type: type as any, content, status: 'complete', wordCount: content.split(' ').length };
        results.push(completed);
        setSections(prev => prev.map(s => s.id === type ? completed : s));
        setGenerationProgress(((i + 1) / sectionsToGenerate.length) * 100);
    }
    setIsGenerating(false);
  }, [selectedSections, defaultCaseData]);

  return (
    <div className="p-8 bg-white dark:bg-slate-950 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
      <Tabs defaultValue="configure" className="space-y-8">
        <div className="flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Intelligence <span className="text-blue-600">Synthesizer</span></h2>
              <p className="text-slate-500 font-medium">Neural report orchestration for compliant filings</p>
           </div>
           <TabsList className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl h-14">
              <TabsTrigger value="configure" className="rounded-xl px-6 font-bold gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-none"><Settings className="w-4 h-4"/> Configure</TabsTrigger>
              <TabsTrigger value="preview" disabled={sections.length === 0} className="rounded-xl px-6 font-bold gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-none"><Eye className="w-4 h-4"/> Preview</TabsTrigger>
              <TabsTrigger value="export" disabled={sections.length === 0} className="rounded-xl px-6 font-bold gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-none"><Download className="w-4 h-4"/> Export</TabsTrigger>
           </TabsList>
        </div>

        <TabsContent value="configure">
           <ReportConfigPanel 
             templates={reportTemplates}
             selectedTemplate={selectedTemplate}
             onTemplateSelect={setSelectedTemplate}
             reportTitle={reportTitle}
             onTitleChange={setReportTitle}
             selectedSections={selectedSections}
             onToggleSection={(id) => setSelectedSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
             customInstructions={customInstructions}
             onInstructionsChange={setCustomInstructions}
             caseData={defaultCaseData}
             isGenerating={isGenerating}
             progress={generationProgress}
             onGenerate={handleGenerate}
             sectionConfig={sectionConfig}
           />
        </TabsContent>

        <TabsContent value="preview">
           <ReportPreview sections={sections} title={reportTitle} caseData={defaultCaseData} />
        </TabsContent>

        <TabsContent value="export">
           <ReportExportPanel sections={sections} onExport={(f) => onExport?.(f)} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoReportGenerator;
