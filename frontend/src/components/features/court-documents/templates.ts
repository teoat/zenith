import { DocumentType, TemplateConfig, Certification } from '@/types/court-documents';

export const documentTemplates: Record<DocumentType, TemplateConfig> = {
  affidavit: {
    name: 'Affidavit',
    description: 'Sworn statement of facts',
    requiredSections: ['caption', 'affiant_statement', 'factual_assertions', 'conclusion', 'jurat'],
    requiredCertifications: ['notarization']
  },
  motion: {
    name: 'Motion',
    description: 'Request for court action',
    requiredSections: ['caption', 'introduction', 'factual_background', 'legal_argument', 'conclusion', 'prayer_for_relief'],
    requiredCertifications: ['attorney_signature']
  },
  subpoena: {
    name: 'Subpoena',
    description: 'Order to produce documents or testimony',
    requiredSections: ['caption', 'command', 'documents_requested', 'return_date', 'compliance_instructions'],
    requiredCertifications: ['court_stamp', 'attorney_signature']
  },
  brief: {
    name: 'Legal Brief',
    description: 'Written legal argument',
    requiredSections: ['caption', 'questions_presented', 'statement_of_facts', 'argument', 'conclusion'],
    requiredCertifications: ['attorney_signature']
  },
  complaint: {
    name: 'Complaint',
    description: 'Initial pleading commencing action',
    requiredSections: ['caption', 'parties', 'jurisdiction', 'factual_allegations', 'claims', 'prayer_for_relief'],
    requiredCertifications: ['attorney_signature']
  },
  response: {
    name: 'Response/Answer',
    description: 'Response to complaint or motion',
    requiredSections: ['caption', 'general_denial', 'specific_responses', 'affirmative_defenses', 'conclusion'],
    requiredCertifications: ['attorney_signature']
  },
  declaration: {
    name: 'Declaration',
    description: 'Unsworn statement under penalty of perjury',
    requiredSections: ['caption', 'declarant_info', 'statement_of_facts', 'conclusion'],
    requiredCertifications: ['witness']
  },
  exhibit_list: {
    name: 'Exhibit List',
    description: 'Index of evidence exhibits',
    requiredSections: ['caption', 'exhibit_index', 'authentication_notes'],
    requiredCertifications: ['attorney_signature']
  }
};

export const sectionTemplates: Record<string, { title: string; placeholder: string }> = {
  caption: { title: 'Caption', placeholder: 'Court name, case number, parties...' },
  affiant_statement: { title: 'Affiant Statement', placeholder: 'I, [Name], being duly sworn, state as follows...' },
  factual_assertions: { title: 'Factual Assertions', placeholder: 'Numbered factual statements...' },
  introduction: { title: 'Introduction', placeholder: 'Brief overview of the motion and relief sought...' },
  factual_background: { title: 'Factual Background', placeholder: 'Relevant facts giving rise to this motion...' },
  legal_argument: { title: 'Legal Argument', placeholder: 'Legal basis and case law supporting the motion...' },
  conclusion: { title: 'Conclusion', placeholder: 'Summary and requested action...' },
  prayer_for_relief: { title: 'Prayer for Relief', placeholder: 'WHEREFORE, Plaintiff requests that the Court...' },
  jurat: { title: 'Jurat', placeholder: 'Subscribed and sworn to before me...' },
  command: { title: 'Command', placeholder: 'YOU ARE COMMANDED to appear/produce...' },
  documents_requested: { title: 'Documents Requested', placeholder: 'List of documents to be produced...' },
  return_date: { title: 'Return Date', placeholder: 'Date and time for compliance...' },
  compliance_instructions: { title: 'Compliance Instructions', placeholder: 'How to comply with this subpoena...' },
  questions_presented: { title: 'Questions Presented', placeholder: 'Legal questions for the court...' },
  statement_of_facts: { title: 'Statement of Facts', placeholder: 'Factual narrative...' },
  argument: { title: 'Argument', placeholder: 'Legal analysis and argument...' },
  parties: { title: 'Parties', placeholder: 'Description of parties to this action...' },
  jurisdiction: { title: 'Jurisdiction', placeholder: 'Basis for court jurisdiction...' },
  factual_allegations: { title: 'Factual Allegations', placeholder: 'Numbered allegations...' },
  claims: { title: 'Claims', placeholder: 'Causes of action...' },
  general_denial: { title: 'General Denial', placeholder: 'General denial of allegations...' },
  specific_responses: { title: 'Specific Responses', placeholder: 'Responses to each allegation...' },
  affirmative_defenses: { title: 'Affirmative Defenses', placeholder: 'Affirmative defenses raised...' },
  declarant_info: { title: 'Declarant Information', placeholder: 'Identity and basis for knowledge...' },
  exhibit_index: { title: 'Exhibit Index', placeholder: 'Numbered list of exhibits...' },
  authentication_notes: { title: 'Authentication Notes', placeholder: 'Notes on exhibit authentication...' }
};
