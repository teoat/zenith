/**
 * AutoReportGenerator - Phase 6G Advanced Intelligence
 * AI-powered investigation report generation
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Progress } from '@/components/ui/Progress';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { secureRandom } from '../../utils/secureRandom'; // Module not found
import {
  FileText,
  Wand2,
  Download,
  Eye,
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
  Brain,
  Book,
  Scale,
  Target,
  Users,
  Building,
  DollarSign,
  Loader2
} from 'lucide-react';
import './AutoReportGenerator.css';

// Types
interface ReportSection {
  id: string;
  title: string;
  type: 'executive_summary' | 'findings' | 'evidence' | 'timeline' | 'recommendations' | 'appendix';
  content: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  wordCount?: number;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  format: 'sar' | 'internal' | 'regulatory' | 'legal' | 'custom';
}

interface CaseData {
  caseId: string;
  title: string;
  subjects: { name: string; type: string; riskScore: number }[];
  evidenceCount: number;
  transactionTotal: number;
  alertCount: number;
}

interface AutoReportGeneratorProps {
  caseData?: CaseData;
  onGenerate?: (sections: ReportSection[]) => void;
  onExport?: (format: 'pdf' | 'docx' | 'html') => void;
}

// Mock templates
const reportTemplates: ReportTemplate[] = [
  {
    id: 'sar',
    name: 'SAR Filing Report',
    description: 'Suspicious Activity Report format for regulatory filing',
    sections: ['executive_summary', 'subject_info', 'activity_description', 'supporting_documentation'],
    format: 'sar'
  },
  {
    id: 'internal',
    name: 'Internal Investigation',
    description: 'Comprehensive internal investigation report',
    sections: ['executive_summary', 'findings', 'evidence', 'timeline', 'recommendations'],
    format: 'internal'
  },
  {
    id: 'regulatory',
    name: 'Regulatory Response',
    description: 'Response to regulatory inquiry or examination',
    sections: ['executive_summary', 'factual_background', 'analysis', 'remediation'],
    format: 'regulatory'
  },
  {
    id: 'legal',
    name: 'Legal Brief',
    description: 'Court-ready legal documentation',
    sections: ['facts', 'legal_analysis', 'evidence_summary', 'conclusions'],
    format: 'legal'
  }
];

// Section configuration
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
  conclusions: { icon: CheckCircle, label: 'Conclusions', estimatedWords: 250 },
  appendix: { icon: FileText, label: 'Appendix', estimatedWords: 100 }
};

export const AutoReportGenerator: React.FC<AutoReportGeneratorProps> = ({
  caseData,
  onGenerate,
  onExport
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('internal');
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [_activeSection, _setActiveSection] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set(['executive_summary', 'findings', 'evidence', 'timeline', 'recommendations']));
  const [reportTitle, setReportTitle] = useState('Investigation Report');

  // Default case data
  const defaultCaseData: CaseData = caseData || {
    caseId: 'CASE-2024-001',
    title: 'Suspicious Transaction Network Investigation',
    subjects: [
      { name: 'Shell Corporation Alpha', type: 'company', riskScore: 92 },
      { name: 'John Doe', type: 'person', riskScore: 85 }
    ],
    evidenceCount: 47,
    transactionTotal: 2500000,
    alertCount: 12
  };

  // Current template - reserved for future template switching functionality
  void useMemo(() => {
    return reportTemplates.find(t => t.id === selectedTemplate) || reportTemplates[0];
  }, [selectedTemplate]);

  // Simulate AI generation for a section
  const generateSection = useCallback(async (sectionType: string): Promise<string> => {
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1000 + secureRandom.random() * 1500));
    
    // Mock generated content based on section type
    const mockContent: Record<string, string> = {
      executive_summary: `This investigation was initiated on ${new Date().toLocaleDateString()} following the detection of suspicious transaction patterns involving ${defaultCaseData.subjects[0].name}. Analysis of ${defaultCaseData.evidenceCount} pieces of evidence revealed a coordinated scheme involving multiple offshore entities and structured transactions totaling approximately $${(defaultCaseData.transactionTotal).toLocaleString()}.\n\nKey findings indicate deliberate attempts to obscure beneficial ownership and layer funds through a network of shell companies across multiple jurisdictions. The investigation identified ${defaultCaseData.alertCount} distinct red flags consistent with money laundering typologies.`,
      
      findings: `**Finding 1: Structured Transaction Pattern**\nAnalysis revealed systematic structuring of transactions below reporting thresholds, with 78% of transfers falling within the $9,000-$9,900 range.\n\n**Finding 2: Shell Company Network**\nThe subject maintains beneficial ownership of at least 7 corporate entities across 4 jurisdictions, all registered within a 90-day period.\n\n**Finding 3: Rapid Fund Movement**\nFunds flow indicates "round-trip" transactions with funds returning to origin within 72 hours through intermediary accounts.\n\n**Finding 4: Nominee Director Usage**\nAll identified entities utilize the same nominee director services, obscuring true beneficial ownership.`,
      
      evidence: `The investigation examined ${defaultCaseData.evidenceCount} items of evidence including:\n\n- Bank statements (24 documents)\n- Corporate registry filings (12 documents)\n- Wire transfer records (8 documents)\n- Email correspondence (3 threads)\n\nDigital forensic analysis of metadata confirmed document authenticity and established a clear chronological timeline of events. Cross-referencing of transaction data with entity registrations revealed coordinated timing patterns inconsistent with legitimate business operations.`,
      
      timeline: `**January 15, 2024** - First shell company registered in Delaware\n**January 28, 2024** - Offshore account opened in Cayman Islands\n**February 10, 2024** - Initial wire transfer of $450,000\n**February 15-28, 2024** - Series of structured deposits totaling $890,000\n**March 5, 2024** - Second shell company activated\n**March 12, 2024** - Round-trip transaction pattern initiated\n**March 20, 2024** - Compliance alert triggered\n**April 1, 2024** - Investigation commenced`,
      
      recommendations: `Based on the findings of this investigation, the following actions are recommended:\n\n1. **Immediate SAR Filing** - File Suspicious Activity Report within 30 days\n2. **Account Restrictions** - Implement enhanced monitoring on all associated accounts\n3. **Law Enforcement Referral** - Consider referral to appropriate law enforcement agency\n4. **Enhanced Due Diligence** - Apply EDD procedures to all connected parties\n5. **Network Monitoring** - Establish ongoing surveillance of the identified shell network`
    };

    return mockContent[sectionType] || `Generated content for ${sectionType} section. This section analyzes relevant aspects of the investigation and provides detailed findings based on the available evidence.`;
  }, [defaultCaseData]);

  // Handle report generation
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    const sectionsToGenerate = Array.from(selectedSections);
    const generatedSections: ReportSection[] = [];
    
    for (let i = 0; i < sectionsToGenerate.length; i++) {
      const sectionType = sectionsToGenerate[i];
      const config = sectionConfig[sectionType as keyof typeof sectionConfig];
      
      setSections(prev => [
        ...prev.filter(s => s.id !== sectionType),
        {
          id: sectionType,
          title: config?.label || sectionType,
          type: sectionType as ReportSection['type'],
          content: '',
          status: 'generating'
        }
      ]);
      
      try {
        const content = await generateSection(sectionType);
        const section: ReportSection = {
          id: sectionType,
          title: config?.label || sectionType,
          type: sectionType as ReportSection['type'],
          content,
          status: 'complete',
          wordCount: content.split(/\s+/).length
        };
        
        generatedSections.push(section);
        setSections(prev => prev.map(s => s.id === sectionType ? section : s));
      } catch {
        setSections(prev => prev.map(s => 
          s.id === sectionType ? { ...s, status: 'error' } : s
        ));
      }
      
      setGenerationProgress(((i + 1) / sectionsToGenerate.length) * 100);
    }
    
    setIsGenerating(false);
    onGenerate?.(generatedSections);
  }, [selectedSections, generateSection, onGenerate]);

  // Toggle section selection
  const toggleSection = useCallback((sectionId: string) => {
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Calculate total estimated words
  const estimatedWordCount = useMemo(() => {
    return Array.from(selectedSections).reduce((sum, id) => {
      const config = sectionConfig[id as keyof typeof sectionConfig];
      return sum + (config?.estimatedWords || 300);
    }, 0);
  }, [selectedSections]);

  return (
    <Card className="auto-report-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="report-icon">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Auto Report Generator</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI-powered investigation documentation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <FileText className="w-3 h-3" />
              ~{estimatedWordCount.toLocaleString()} words
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              ~{Math.ceil(selectedSections.size * 1.5)} min
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="configure">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="configure">
              <Settings className="w-4 h-4 mr-1" />
              Configure
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={sections.length === 0}>
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="export" disabled={sections.length === 0}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="mt-4">
            <div className="config-grid">
              {/* Template Selection */}
              <div className="config-section">
                <Label className="section-label">Report Template</Label>
                <div className="template-grid">
                  {reportTemplates.map(tmpl => (
                    <div
                      key={tmpl.id}
                      className={`template-card ${selectedTemplate === tmpl.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTemplate(tmpl.id); } }}
                      tabIndex={0}
                      role="button"
                    >
                      <div className="template-name">{tmpl.name}</div>
                      <div className="template-description">{tmpl.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Title */}
              <div className="config-section">
                <Label className="section-label">Report Title</Label>
                <Input
                  value={reportTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportTitle(e.target.value)}
                  placeholder="Enter report title..."
                />
              </div>

              {/* Section Selection */}
              <div className="config-section">
                <Label className="section-label">Sections to Include</Label>
                <div className="sections-grid">
                  {Object.entries(sectionConfig).map(([id, config]) => {
                    const Icon = config.icon;
                    return (
                      <div key={id} className="section-checkbox">
                        <Checkbox
                          id={id}
                          checked={selectedSections.has(id)}
                          onCheckedChange={() => toggleSection(id)}
                        />
                        <Label htmlFor={id} className="section-checkbox-label">
                          <Icon className="w-4 h-4" />
                          <span>{config.label}</span>
                          <span className="word-estimate">~{config.estimatedWords} words</span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="config-section">
                <Label className="section-label">Custom Instructions (Optional)</Label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Add any specific instructions for the AI generator..."
                  rows={3}
                />
              </div>

              {/* Case Summary */}
              <div className="case-summary">
                <div className="summary-header">
                  <Building className="w-4 h-4" />
                  <span>Case Summary: {defaultCaseData.caseId}</span>
                </div>
                <div className="summary-grid">
                  <div className="summary-item">
                    <Users className="w-4 h-4" />
                    <span>{defaultCaseData.subjects.length} Subjects</span>
                  </div>
                  <div className="summary-item">
                    <FileText className="w-4 h-4" />
                    <span>{defaultCaseData.evidenceCount} Evidence Items</span>
                  </div>
                  <div className="summary-item">
                    <DollarSign className="w-4 h-4" />
                    <span>${defaultCaseData.transactionTotal.toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{defaultCaseData.alertCount} Alerts</span>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                className="generate-button"
                onClick={handleGenerate}
                disabled={isGenerating || selectedSections.size === 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating... {Math.round(generationProgress)}%
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>

              {isGenerating && (
                <Progress value={generationProgress} className="generation-progress" />
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <ScrollArea className="report-preview">
              <div className="preview-header">
                <h1 className="preview-title">{reportTitle}</h1>
                <p className="preview-subtitle">Case ID: {defaultCaseData.caseId}</p>
                <p className="preview-date">Generated: {new Date().toLocaleDateString()}</p>
              </div>
              
              {sections.map(section => (
                <div key={section.id} className="preview-section">
                  <h2 className="preview-section-title">{section.title}</h2>
                  {section.status === 'generating' ? (
                    <div className="generating-indicator">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating content...</span>
                    </div>
                  ) : section.status === 'error' ? (
                    <div className="error-indicator">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Error generating section</span>
                    </div>
                  ) : (
                    <div className="preview-content">{section.content}</div>
                  )}
                  {section.wordCount && (
                    <div className="section-meta">
                      <Badge variant="outline">{section.wordCount} words</Badge>
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="export" className="mt-4">
            <div className="export-options">
              <div className="export-format-grid">
                {['pdf', 'docx', 'html'].map(format => (
                  <Button
                    key={format}
                    variant="outline"
                    className="export-format-btn"
                    onClick={() => onExport?.(format as 'pdf' | 'docx' | 'html')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export as {format.toUpperCase()}
                  </Button>
                ))}
              </div>
              <div className="export-info">
                <p>Total Sections: {sections.filter(s => s.status === 'complete').length}</p>
                <p>Total Words: {sections.reduce((sum, s) => sum + (s.wordCount || 0), 0).toLocaleString()}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AutoReportGenerator;
