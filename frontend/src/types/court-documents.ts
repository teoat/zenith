export type DocumentType = 
  | 'affidavit'
  | 'motion'
  | 'subpoena'
  | 'brief'
  | 'complaint'
  | 'response'
  | 'declaration'
  | 'exhibit_list';

export interface Party {
  name: string;
  role: 'plaintiff' | 'defendant' | 'witness' | 'affiant' | 'petitioner' | 'respondent';
  address?: string;
  counsel?: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface Exhibit {
  id: string;
  label: string;
  description: string;
  evidenceId?: string;
}

export interface Certification {
  type: 'notarization' | 'attorney_signature' | 'witness' | 'court_stamp';
  required: boolean;
  completed: boolean;
  signatory?: string;
  date?: Date;
}

export interface LegalDocument {
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
  status: 'draft' | 'review' | 'final';
}

export interface TemplateConfig {
  name: string;
  description: string;
  requiredSections: string[];
  requiredCertifications: Certification['type'][];
}
