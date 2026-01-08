/**
 * CourtDocumentGenerator - Phase 6G Advanced Intelligence
 * Legal document automation for court-ready documentation
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Gavel, CheckCircle, Eye, Stamp, Loader2 } from 'lucide-react';

import { LegalDocument, DocumentType, Party, DocumentSection, Exhibit, Certification } from '@/types/court-documents';
import { documentTemplates, sectionTemplates } from '@/components/features/court-documents/templates';
import { DocumentTypeSelector } from '@/components/features/court-documents/DocumentTypeSelector';
import { CaseInfoForm } from '@/components/features/court-documents/CaseInfoForm';
import { PartiesList } from '@/components/features/court-documents/PartiesList';
import { DocumentSectionsEditor } from '@/components/features/court-documents/DocumentSectionsEditor';
import { ExhibitsList } from '@/components/features/court-documents/ExhibitsList';
import { DocumentPreview } from '@/components/features/court-documents/DocumentPreview';

interface CourtDocumentGeneratorProps {
  caseId?: string;
  caseName?: string;
  onGenerate?: (document: LegalDocument) => void;
  onExport?: (document: LegalDocument, format: 'pdf' | 'docx') => void;
}

export const CourtDocumentGenerator: React.FC<CourtDocumentGeneratorProps> = ({
  caseId = 'CASE-2024-001',
  caseName = 'In re: Investigation of Suspicious Transactions',
  onGenerate,
  onExport
}) => {
  const [documentType, setDocumentType] = useState<DocumentType>('affidavit');
  const [title, setTitle] = useState('');
  const [caseNumber, setCaseNumber] = useState(caseId);
  const [jurisdiction, setJurisdiction] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<LegalDocument | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const template = useMemo(() => documentTemplates[documentType], [documentType]);

  const initializeSections = useCallback((type: DocumentType) => {
    const config = documentTemplates[type];
    const newSections = config.requiredSections.map((sectionId, index) => ({
      id: sectionId,
      title: sectionTemplates[sectionId]?.title || sectionId,
      content: '',
      order: index
    }));
    setSections(newSections);
  }, []);

  // Initialize on mount
  React.useEffect(() => {
    initializeSections(documentType);
  }, [documentType, initializeSections]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const certifications: Certification[] = template.requiredCertifications.map(type => ({
      type,
      required: true,
      completed: false
    }));

    const document: LegalDocument = {
      id: `doc-${Date.now()}`,
      type: documentType,
      title: title || `${template.name} - ${caseNumber}`,
      caseNumber,
      jurisdiction,
      parties,
      sections,
      exhibits,
      certifications,
      generatedAt: new Date(),
      status: 'draft'
    };

    setGeneratedDocument(document);
    setIsGenerating(false);
    onGenerate?.(document);
  }, [documentType, title, caseNumber, jurisdiction, parties, sections, exhibits, template, onGenerate]);

  const updateSection = useCallback((sectionId: string, content: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, content } : s));
  }, []);

  const addParty = useCallback(() => setParties(prev => [...prev, { name: '', role: 'plaintiff' }]), []);
  const removeParty = useCallback((idx: number) => setParties(prev => prev.filter((_, i) => i !== idx)), []);
  const updateParty = useCallback((idx: number, updates: Partial<Party>) => {
    setParties(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  }, []);

  const addExhibit = useCallback(() => {
    const labelChar = String.fromCharCode(65 + exhibits.length);
    setExhibits(prev => [...prev, { id: `ex-${Date.now()}`, label: `Exhibit ${labelChar}`, description: '' }]);
  }, [exhibits.length]);
  const removeExhibit = useCallback((idx: number) => setExhibits(prev => prev.filter((_, i) => i !== idx)), []);
  const updateExhibit = useCallback((idx: number, updates: Partial<Exhibit>) => {
    setExhibits(prev => prev.map((e, i) => i === idx ? { ...e, ...updates } : e));
  }, []);

  const completionPercentage = useMemo(() => {
    if (sections.length === 0) return 0;
    const filledSections = sections.filter(s => s.content.trim().length > 0).length;
    return Math.round((filledSections / sections.length) * 100);
  }, [sections]);

  const activeDocumentForPreview = useMemo(() => {
    if (generatedDocument) return generatedDocument;
    return {
      id: 'preview',
      type: documentType,
      title: title || template.name,
      caseNumber,
      jurisdiction,
      parties,
      sections,
      exhibits,
      certifications: [],
      generatedAt: new Date(),
      status: 'draft' as const
    };
  }, [generatedDocument, documentType, title, template.name, caseNumber, jurisdiction, parties, sections, exhibits]);

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900">Court Document Generator</CardTitle>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Automated legal documentation workflow</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {generatedDocument && (
              <Badge variant="outline" className="gap-1.5 py-1.5 px-3 border-emerald-100 bg-emerald-50 text-emerald-700 font-bold">
                <CheckCircle className="w-3 h-3" />
                {generatedDocument.status.toUpperCase()}
              </Badge>
            )}
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Completion</span>
              <div className="flex items-center gap-2">
                <Progress value={completionPercentage} className="h-1.5 w-24 bg-slate-100" />
                <span className="text-xs font-black text-slate-900">{completionPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 space-y-8">
        {!previewMode ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DocumentTypeSelector
              selectedType={documentType}
              onSelect={(type) => {
                setDocumentType(type);
                initializeSections(type);
              }}
            />

            <Separator className="bg-slate-100" />

            <CaseInfoForm
              title={title}
              autoTitle={`${template.name} - ${caseNumber}`}
              setTitle={setTitle}
              caseNumber={caseNumber}
              setCaseNumber={setCaseNumber}
              jurisdiction={jurisdiction}
              setJurisdiction={setJurisdiction}
            />

            <PartiesList
              parties={parties}
              onAdd={addParty}
              onUpdate={updateParty}
              onRemove={removeParty}
            />

            <DocumentSectionsEditor
              sections={sections}
              onUpdate={updateSection}
            />

            <ExhibitsList
              exhibits={exhibits}
              onAdd={addExhibit}
              onUpdate={updateExhibit}
              onRemove={removeExhibit}
            />

            <div className="sticky bottom-6 left-0 right-0 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl flex items-center justify-between z-30">
               <div className="flex items-center gap-4 flex-1 mr-8">
                  <div className="flex-1">
                     <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                        <span>Workflow Progress</span>
                        <span>{completionPercentage}%</span>
                     </div>
                     <Progress value={completionPercentage} className="h-2 bg-slate-100" />
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setPreviewMode(true)} 
                    disabled={sections.length === 0}
                    className="font-bold border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || completionPercentage < 50}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 min-w-[180px]"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processsing...</>
                    ) : (
                      <><Stamp className="w-4 h-4 mr-2" /> Finalize Document</>
                    )}
                  </Button>
               </div>
            </div>
          </div>
        ) : (
          <div className="animate-in zoom-in-95 duration-300">
            <DocumentPreview
              document={activeDocumentForPreview}
              caseName={caseName}
              onBack={() => setPreviewMode(false)}
              onExport={(format) => onExport?.(activeDocumentForPreview, format)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourtDocumentGenerator;
