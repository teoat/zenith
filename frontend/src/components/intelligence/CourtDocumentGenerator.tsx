/**
 * CourtDocumentGenerator - Phase 6G Advanced Intelligence
 * Legal document automation for court-ready documentation
 */

import React, { useState, useCallback, useMemo, type ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/Separator";
import { Progress } from "@/components/ui/Progress";
import {
  Scale,
  FileText,
  Stamp,
  Download,
  Eye,
  CheckCircle,
  Users,
  Gavel,
  Loader2,
} from "lucide-react";
import "./CourtDocumentGenerator.css";

// Types
interface LegalDocument {
  id: string;
  type: DocumentType;
  title: string;
  caseNumber: string;
  jurisdiction: string;
  parties: Party[];
  sections: DocumentSection[];
  exhibits: Exhibit[];
  certifications: Certification[];
  generatedAt: Date;
  status: "draft" | "review" | "final";
}

type DocumentType =
  | "affidavit"
  | "motion"
  | "subpoena"
  | "brief"
  | "complaint"
  | "response"
  | "declaration"
  | "exhibit_list";

interface Party {
  name: string;
  role:
    | "plaintiff"
    | "defendant"
    | "witness"
    | "affiant"
    | "petitioner"
    | "respondent";
  address?: string;
  counsel?: string;
}

interface DocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Exhibit {
  id: string;
  label: string;
  description: string;
  evidenceId?: string;
}

interface Certification {
  type: "notarization" | "attorney_signature" | "witness" | "court_stamp";
  required: boolean;
  completed: boolean;
  signatory?: string;
  date?: Date;
}

interface CourtDocumentGeneratorProps {
  caseId?: string;
  caseName?: string;
  onGenerate?: (document: LegalDocument) => void;
  onExport?: (document: LegalDocument, format: "pdf" | "docx") => void;
}

// Document templates
const documentTemplates: Record<
  DocumentType,
  {
    name: string;
    description: string;
    requiredSections: string[];
    requiredCertifications: Certification["type"][];
  }
> = {
  affidavit: {
    name: "Affidavit",
    description: "Sworn statement of facts",
    requiredSections: [
      "caption",
      "affiant_statement",
      "factual_assertions",
      "conclusion",
      "jurat",
    ],
    requiredCertifications: ["notarization"],
  },
  motion: {
    name: "Motion",
    description: "Request for court action",
    requiredSections: [
      "caption",
      "introduction",
      "factual_background",
      "legal_argument",
      "conclusion",
      "prayer_for_relief",
    ],
    requiredCertifications: ["attorney_signature"],
  },
  subpoena: {
    name: "Subpoena",
    description: "Order to produce documents or testimony",
    requiredSections: [
      "caption",
      "command",
      "documents_requested",
      "return_date",
      "compliance_instructions",
    ],
    requiredCertifications: ["court_stamp", "attorney_signature"],
  },
  brief: {
    name: "Legal Brief",
    description: "Written legal argument",
    requiredSections: [
      "caption",
      "questions_presented",
      "statement_of_facts",
      "argument",
      "conclusion",
    ],
    requiredCertifications: ["attorney_signature"],
  },
  complaint: {
    name: "Complaint",
    description: "Initial pleading commencing action",
    requiredSections: [
      "caption",
      "parties",
      "jurisdiction",
      "factual_allegations",
      "claims",
      "prayer_for_relief",
    ],
    requiredCertifications: ["attorney_signature"],
  },
  response: {
    name: "Response/Answer",
    description: "Response to complaint or motion",
    requiredSections: [
      "caption",
      "general_denial",
      "specific_responses",
      "affirmative_defenses",
      "conclusion",
    ],
    requiredCertifications: ["attorney_signature"],
  },
  declaration: {
    name: "Declaration",
    description: "Unsworn statement under penalty of perjury",
    requiredSections: [
      "caption",
      "declarant_info",
      "statement_of_facts",
      "conclusion",
    ],
    requiredCertifications: ["witness"],
  },
  exhibit_list: {
    name: "Exhibit List",
    description: "Index of evidence exhibits",
    requiredSections: ["caption", "exhibit_index", "authentication_notes"],
    requiredCertifications: ["attorney_signature"],
  },
};

// Section templates
const sectionTemplates: Record<string, { title: string; placeholder: string }> =
  {
    caption: {
      title: "Caption",
      placeholder: "Court name, case number, parties...",
    },
    affiant_statement: {
      title: "Affiant Statement",
      placeholder: "I, [Name], being duly sworn, state as follows...",
    },
    factual_assertions: {
      title: "Factual Assertions",
      placeholder: "Numbered factual statements...",
    },
    introduction: {
      title: "Introduction",
      placeholder: "Brief overview of the motion and relief sought...",
    },
    factual_background: {
      title: "Factual Background",
      placeholder: "Relevant facts giving rise to this motion...",
    },
    legal_argument: {
      title: "Legal Argument",
      placeholder: "Legal basis and case law supporting the motion...",
    },
    conclusion: {
      title: "Conclusion",
      placeholder: "Summary and requested action...",
    },
    prayer_for_relief: {
      title: "Prayer for Relief",
      placeholder: "WHEREFORE, Plaintiff requests that the Court...",
    },
    jurat: {
      title: "Jurat",
      placeholder: "Subscribed and sworn to before me...",
    },
    command: {
      title: "Command",
      placeholder: "YOU ARE COMMANDED to appear/produce...",
    },
    documents_requested: {
      title: "Documents Requested",
      placeholder: "List of documents to be produced...",
    },
    return_date: {
      title: "Return Date",
      placeholder: "Date and time for compliance...",
    },
    compliance_instructions: {
      title: "Compliance Instructions",
      placeholder: "How to comply with this subpoena...",
    },
    questions_presented: {
      title: "Questions Presented",
      placeholder: "Legal questions for the court...",
    },
    statement_of_facts: {
      title: "Statement of Facts",
      placeholder: "Factual narrative...",
    },
    argument: {
      title: "Argument",
      placeholder: "Legal analysis and argument...",
    },
    parties: {
      title: "Parties",
      placeholder: "Description of parties to this action...",
    },
    jurisdiction: {
      title: "Jurisdiction",
      placeholder: "Basis for court jurisdiction...",
    },
    factual_allegations: {
      title: "Factual Allegations",
      placeholder: "Numbered allegations...",
    },
    claims: { title: "Claims", placeholder: "Causes of action..." },
    general_denial: {
      title: "General Denial",
      placeholder: "General denial of allegations...",
    },
    specific_responses: {
      title: "Specific Responses",
      placeholder: "Responses to each allegation...",
    },
    affirmative_defenses: {
      title: "Affirmative Defenses",
      placeholder: "Affirmative defenses raised...",
    },
    declarant_info: {
      title: "Declarant Information",
      placeholder: "Identity and basis for knowledge...",
    },
    exhibit_index: {
      title: "Exhibit Index",
      placeholder: "Numbered list of exhibits...",
    },
    authentication_notes: {
      title: "Authentication Notes",
      placeholder: "Notes on exhibit authentication...",
    },
  };

export const CourtDocumentGenerator: React.FC<CourtDocumentGeneratorProps> = ({
  caseId = "CASE-2024-001",
  caseName = "In re: Investigation of Suspicious Transactions",
  onGenerate,
  onExport,
}) => {
  const [documentType, setDocumentType] = useState<DocumentType>("affidavit");
  const [title, setTitle] = useState("");
  const [caseNumber, setCaseNumber] = useState(caseId);
  const [jurisdiction, setJurisdiction] = useState("");
  const [parties, setParties] = useState<Party[]>([]);
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] =
    useState<LegalDocument | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const template = documentTemplates[documentType];

  // Initialize sections when document type changes
  const initializeSections = useCallback(() => {
    const newSections = template.requiredSections.map((sectionId, index) => ({
      id: sectionId,
      title: sectionTemplates[sectionId]?.title || sectionId,
      content: "",
      order: index,
    }));
    setSections(newSections);
  }, [template]);

  // Generate document
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);

    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const certifications: Certification[] = template.requiredCertifications.map(
      (type) => ({
        type,
        required: true,
        completed: false,
      }),
    );

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
      status: "draft",
    };

    setGeneratedDocument(document);
    setIsGenerating(false);
    onGenerate?.(document);
  }, [
    documentType,
    title,
    caseNumber,
    jurisdiction,
    parties,
    sections,
    exhibits,
    template,
    onGenerate,
  ]);

  // Update section content
  const updateSection = useCallback((sectionId: string, content: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, content } : s)),
    );
  }, []);

  // Add party
  const addParty = useCallback(() => {
    setParties((prev) => [...prev, { name: "", role: "plaintiff" }]);
  }, []);

  // Add exhibit
  const addExhibit = useCallback(() => {
    const label = String.fromCharCode(65 + exhibits.length); // A, B, C...
    setExhibits((prev) => [
      ...prev,
      { id: `ex-${Date.now()}`, label: `Exhibit ${label}`, description: "" },
    ]);
  }, [exhibits.length]);

  // Completion percentage
  const completionPercentage = useMemo(() => {
    const filledSections = sections.filter(
      (s) => s.content.trim().length > 0,
    ).length;
    return Math.round((filledSections / sections.length) * 100) || 0;
  }, [sections]);

  return (
    <Card className="court-document-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="document-icon">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Court Document Generator
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Legal document automation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {generatedDocument && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                {generatedDocument.status}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              {completionPercentage}% Complete
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!previewMode ? (
          <>
            {/* Document Type Selection */}
            <div className="document-type-section">
              <Label className="section-label">Document Type</Label>
              <div className="type-grid">
                {Object.entries(documentTemplates).map(([type, config]) => (
                  <div
                    key={type}
                    className={`type-card ${documentType === type ? "selected" : ""}`}
                    onClick={() => {
                      setDocumentType(type as DocumentType);
                      initializeSections();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setDocumentType(type as DocumentType);
                        initializeSections();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <Scale className="w-5 h-5" />
                    <div className="type-info">
                      <span className="type-name">{config.name}</span>
                      <span className="type-description">
                        {config.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Case Information */}
            <div className="case-info-section">
              <Label className="section-label">Case Information</Label>
              <div className="case-info-grid">
                <div className="field">
                  <Label>Document Title</Label>
                  <Input
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTitle(e.target.value)
                    }
                    placeholder={`${template.name} - ${caseNumber}`}
                  />
                </div>
                <div className="field">
                  <Label>Case Number</Label>
                  <Input
                    value={caseNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCaseNumber(e.target.value)
                    }
                  />
                </div>
                <div className="field">
                  <Label>Jurisdiction</Label>
                  <Select value={jurisdiction} onValueChange={setJurisdiction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="federal">Federal Court</SelectItem>
                      <SelectItem value="state_ny">New York State</SelectItem>
                      <SelectItem value="state_ca">California State</SelectItem>
                      <SelectItem value="state_tx">Texas State</SelectItem>
                      <SelectItem value="state_fl">Florida State</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="parties-section">
              <div className="section-header">
                <Label className="section-label">Parties</Label>
                <Button variant="outline" size="sm" onClick={addParty}>
                  <Users className="w-4 h-4 mr-1" />
                  Add Party
                </Button>
              </div>
              {parties.map((party, idx) => (
                <div key={idx} className="party-row">
                  <Input
                    value={party.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const updated = [...parties];
                      updated[idx].name = e.target.value;
                      setParties(updated);
                    }}
                    placeholder="Party name"
                  />
                  <Select
                    value={party.role}
                    onValueChange={(val) => {
                      const updated = [...parties];
                      updated[idx].role = val as Party["role"];
                      setParties(updated);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plaintiff">Plaintiff</SelectItem>
                      <SelectItem value="defendant">Defendant</SelectItem>
                      <SelectItem value="witness">Witness</SelectItem>
                      <SelectItem value="affiant">Affiant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Document Sections */}
            <div className="sections-section">
              <Label className="section-label">Document Sections</Label>
              <ScrollArea className="sections-scroll">
                {sections.map((section) => (
                  <div key={section.id} className="document-section">
                    <Label>{section.title}</Label>
                    <Textarea
                      value={section.content}
                      onChange={(e) =>
                        updateSection(section.id, e.target.value)
                      }
                      placeholder={
                        sectionTemplates[section.id]?.placeholder ||
                        "Enter content..."
                      }
                      rows={4}
                    />
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Exhibits */}
            <div className="exhibits-section">
              <div className="section-header">
                <Label className="section-label">Exhibits</Label>
                <Button variant="outline" size="sm" onClick={addExhibit}>
                  <FileText className="w-4 h-4 mr-1" />
                  Add Exhibit
                </Button>
              </div>
              {exhibits.map((exhibit, idx) => (
                <div key={exhibit.id} className="exhibit-row">
                  <Badge variant="outline">{exhibit.label}</Badge>
                  <Input
                    value={exhibit.description}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const updated = [...exhibits];
                      updated[idx].description = e.target.value;
                      setExhibits(updated);
                    }}
                    placeholder="Exhibit description"
                  />
                </div>
              ))}
            </div>

            {/* Progress and Actions */}
            <div className="actions-section">
              <Progress
                value={completionPercentage}
                className="completion-progress"
              />
              <div className="action-buttons">
                <Button
                  variant="outline"
                  onClick={() => setPreviewMode(true)}
                  disabled={sections.length === 0}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || completionPercentage < 50}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Stamp className="w-4 h-4 mr-1" />
                      Generate Document
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Preview Mode */
          <div className="preview-container">
            <div className="preview-header">
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                ← Back to Editor
              </Button>
              <div className="preview-actions">
                <Button
                  variant="outline"
                  onClick={() => onExport?.(generatedDocument!, "pdf")}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onExport?.(generatedDocument!, "docx")}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export DOCX
                </Button>
              </div>
            </div>
            <ScrollArea className="preview-scroll">
              <div className="legal-document-preview">
                <div className="document-header">
                  <h1>{title || `${template.name}`}</h1>
                  <p className="case-line">{caseName}</p>
                  <p className="case-number">Case No. {caseNumber}</p>
                </div>

                {sections.map((section) => (
                  <div key={section.id} className="preview-section">
                    <h2>{section.title.toUpperCase()}</h2>
                    <div className="section-content">
                      {section.content || "[Content pending]"}
                    </div>
                  </div>
                ))}

                {exhibits.length > 0 && (
                  <div className="exhibits-list">
                    <h2>EXHIBITS</h2>
                    {exhibits.map((ex) => (
                      <p key={ex.id}>
                        <strong>{ex.label}:</strong> {ex.description}
                      </p>
                    ))}
                  </div>
                )}

                <div className="signature-block">
                  <p>Respectfully submitted,</p>
                  <div className="signature-line" />
                  <p>
                    [Attorney Name]
                    <br />
                    Attorney for [Party]
                  </p>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourtDocumentGenerator;
