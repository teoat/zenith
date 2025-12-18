import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronRight, ChevronLeft, Check, AlertTriangle, User, FileText, Sparkles } from 'lucide-react';
import { CalendarFormat, CurrencyFormat, DecimalFormat } from '../../types/locale';
import { ApprovalQueue } from '../ApprovalQueue';
import { DraftPreview } from '../ui/DraftPreview';
import { draftPreviewService, DraftState } from '../../services/draftPreviewService';
import { useEffect } from 'react';

interface InvestigationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: InvestigationData) => void;
}

export interface InvestigationData {
  title: string;
  // priority: string; // Removed
  assignee: string;
  description: string;
  tags: string[];
  selectedPlugins: string[];
  reconciliationType: 'project-based' | 'general';
  selectedCountry: string; // New: Selected country for investigation
  selectedDocuments: string[]; // New: Documents to be included
  selectedCalendarFormat: CalendarFormat; // New: Selected calendar format
  selectedCurrencyFormat: CurrencyFormat; // New: Selected currency format
  selectedDecimalFormat: DecimalFormat; // New: Selected decimal format
  milestones: string[]; // New: Milestones for the investigation
  proposedFeatures: string[]; // New: Proposed features for the investigation
}

// Predefined country options with flag emojis
const COUNTRY_OPTIONS = [
  { id: 'US', label: 'United States', flag: '🇺🇸', locale: 'en-US', disabled: false },
  { id: 'ID', label: 'Indonesia', flag: '🇮🇩', locale: 'id-ID', disabled: false },
  { id: 'MY', label: 'Malaysia', flag: '🇲🇾', locale: 'en-MY', disabled: true },
  { id: 'SG', label: 'Singapore', flag: '🇸🇬', locale: 'en-SG', disabled: true },
  { id: 'TH', label: 'Thailand', flag: '🇹🇭', locale: 'th-TH', disabled: true },
];

// Mapping of countries to available document types/plugins
const COUNTRY_DOCUMENTS_MAP: Record<string, string[]> = {
  'US': ['Bank Statement (US)', 'Tax Returns (US)', 'Credit Card Statement', 'Loan Applications'],
  'ID': ['Bank Statement (ID)', 'Tax Returns (ID)', 'KTP/Passport', 'Family Card'],
  'MY': ['Bank Statement (MY)', 'Tax Returns (MY)', 'Identity Card'],
  'SG': ['Bank Statement (SG)', 'Tax Returns (SG)', 'NRIC'],
  'TH': ['Bank Statement (TH)', 'Tax Returns (TH)', 'National ID'],
  // Add more as needed
};

const STEPS = [
  { id: 1, title: 'Basic Info', icon: FileText },
  { id: 2, title: 'Plugins & Reconciliation', icon: AlertTriangle },
  { id: 3, title: 'Assignment', icon: User },
  { id: 4, title: 'Review', icon: Check },
];

const InvestigationWizard: React.FC<InvestigationWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [drafts, setDrafts] = useState<DraftState[]>([]);
  
  const [data, setData] = useState<InvestigationData>({
    title: '',
    // priority: 'Medium', // Removed
    assignee: '',
    description: '',
    tags: [],
    selectedPlugins: [],
    reconciliationType: 'general',
    selectedCountry: 'US', // Default to US
    selectedDocuments: [],
    selectedCalendarFormat: 'gregory', // Default
    selectedCurrencyFormat: 'USD', // Default
    selectedDecimalFormat: 'standard', // Default
    milestones: [], // New: Milestones for the investigation
    proposedFeatures: [], // New: Proposed features for the investigation
  });

  const updateField = (field: keyof InvestigationData, value: InvestigationData[keyof InvestigationData]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = () => {
    onComplete(data);
    onClose();
    setStep(1);
    setData({ 
      title: '',
      // priority: 'Medium', // Removed
      assignee: '',
      description: '',
      tags: [],
      selectedPlugins: [],
      reconciliationType: 'general',
      selectedCountry: 'US',
      selectedDocuments: [],
      selectedCalendarFormat: 'gregory',
      selectedCurrencyFormat: 'USD',
      selectedDecimalFormat: 'standard',
      milestones: [], // New: Milestones for the investigation
      proposedFeatures: [], // New: Proposed features for the investigation
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return data.title.length >= 3;
      case 2: return data.selectedCountry !== '';
      case 3: return true;
      default: return true;
    }
  };

  useEffect(() => {
    const unsub = draftPreviewService.addListener((id, newDrafts) => {
      if (id === 'new-investigation') {
        setDrafts(newDrafts);
      }
    });
    return unsub;
  }, []);

  const handleAiAutofill = async () => {
    if (!data.title) return;
    setIsAiLoading(true);
    
    // Simulate AI thinking and proposing changes
    setTimeout(() => {
      draftPreviewService.proposeAIChange(
        'new-investigation',
        'description',
        `Comprehensive investigation into ${data.title}. Focus on identifying nexus of actors and transaction velocity patterns indicative of money laundering.`,
        data.description,
        'AI generated description based on your title.'
      );
      
      draftPreviewService.proposeAIChange(
        'new-investigation',
        'tags',
        ['High Risk', 'Internal Audit', 'Priority'],
        data.tags,
        'Recommended tags for this type of investigation.'
      );
      
      setIsAiLoading(false);
    }, 1500);
  };

  const acceptDraft = (field: string) => {
    const draft = draftPreviewService.acceptDraft('new-investigation', field);
    if (draft) {
      updateField(field as keyof InvestigationData, draft.value);
    }
  };

  const rejectDraft = (field: string) => {
    draftPreviewService.rejectDraft('new-investigation', field);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 overflow-hidden">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <Dialog.Title className="text-xl font-bold">New Investigation</Dialog.Title>
              <Dialog.Close className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </Dialog.Close>
            </div>
            
            {/* Step Indicator */}
            <div className="flex items-center gap-2 mt-4">
              {STEPS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className={`flex items-center gap-2 ${step >= s.id ? 'text-blue-600' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step > s.id ? 'bg-green-500 text-white' :
                      step === s.id ? 'bg-blue-600 text-white' : 
                      'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      {step > s.id ? <Check size={16} /> : s.id}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 ${step > s.id ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 min-h-[300px]">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex justify-between items-end">
                  <div className="flex-1">
                    <label htmlFor="investigation-title" className="block text-sm font-medium mb-2">Investigation Title *</label>
                    <input 
                      id="investigation-title"
                      type="text"
                      value={data.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="e.g., Suspicious Wire Transfer Pattern"
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleAiAutofill}
                    disabled={!data.title || isAiLoading}
                    className="ml-3 h-[46px] px-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAiLoading ? (
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    <span className="font-medium text-sm">Auto-fill</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <label htmlFor="investigation-description" className="block text-sm font-medium mb-2">Description</label>
                  
                  {drafts.find(d => d.field === 'description') ? (
                    <DraftPreview 
                      draft={drafts.find(d => d.field === 'description')!}
                      onAccept={() => acceptDraft('description')}
                      onReject={() => rejectDraft('description')}
                    />
                  ) : (
                    <textarea 
                      id="investigation-description"
                      value={data.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Describe the suspicious activity..."
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                    />
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in">
                <fieldset>
                  <legend className="block text-sm font-medium mb-3">Select Country</legend>
                  <div className="grid grid-cols-3 gap-3" role="radiogroup">
                    {COUNTRY_OPTIONS.map(country => (
                      <button
                        key={country.id}
                        onClick={() => {
                          if (!country.disabled) {
                            updateField('selectedCountry', country.id);
                            updateField('selectedDocuments', []); // Reset documents when country changes
                          }
                        }}
                        disabled={country.disabled}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${country.disabled
                            ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                            : data.selectedCountry === country.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-2xl mr-2" role="img" aria-label={country.label}>{country.flag}</span>
                        <span className="font-medium">{country.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {data.selectedCountry && (
                  <fieldset>
                    <legend className="block text-sm font-medium mb-3">Documents to Include ({COUNTRY_OPTIONS.find(c => c.id === data.selectedCountry)?.label})</legend>
                    <div className="grid grid-cols-2 gap-3">
                      {(COUNTRY_DOCUMENTS_MAP[data.selectedCountry] || []).map(docType => (
                        <button
                          key={docType}
                          onClick={() => {
                            const newDocuments = data.selectedDocuments.includes(docType)
                              ? data.selectedDocuments.filter(d => d !== docType)
                              : [...data.selectedDocuments, docType];
                            updateField('selectedDocuments', newDocuments);
                          }}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${data.selectedDocuments.includes(docType)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                          }`}
                        >
                          <span className="font-medium">{docType}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                <fieldset>
                  <legend className="block text-sm font-medium mb-3">Reconciliation Type</legend>
                  <div className="flex gap-3" role="radiogroup">
                    <button
                      onClick={() => updateField('reconciliationType', 'project-based')}
                      className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${data.reconciliationType === 'project-based'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <span className="font-medium">Project-based</span>
                    </button>
                    <button
                      onClick={() => updateField('reconciliationType', 'general')}
                      className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${data.reconciliationType === 'general'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <span className="font-medium">General</span>
                    </button>
                  </div>
                </fieldset>

                {/* Localization Formats */}
                <fieldset>
                  <legend className="block text-sm font-medium mb-3">Localization Formats</legend>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="calendar-format" className="block text-sm font-medium mb-2">Calendar Format</label>
                      <select
                        id="calendar-format"
                        value={data.selectedCalendarFormat}
                        onChange={(e) => updateField('selectedCalendarFormat', e.target.value as CalendarFormat)}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                      >
                        <option value="gregory">Gregorian</option>
                        <option value="buddhist">Buddhist</option>
                        <option value="islamic">Islamic</option>
                        <option value="hebrew">Hebrew</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="currency-format" className="block text-sm font-medium mb-2">Currency Format</label>
                      <select
                        id="currency-format"
                        value={data.selectedCurrencyFormat}
                        onChange={(e) => updateField('selectedCurrencyFormat', e.target.value as CurrencyFormat)}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="IDR">IDR (Rp)</option>
                        <option value="SGD">SGD (S$)</option>
                        <option value="MYR">MYR (RM)</option>
                        <option value="THB">THB (฿)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="decimal-format" className="block text-sm font-medium mb-2">Decimal Format</label>
                      <select
                        id="decimal-format"
                        value={data.selectedDecimalFormat}
                        onChange={(e) => updateField('selectedDecimalFormat', e.target.value as DecimalFormat)}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                      >
                        <option value="standard">Standard (1,234.56)</option>
                        <option value="accounting">Accounting (1 234,56)</option>
                        <option value="compact">Compact (1.2K)</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                {/* Customization for Other Options */}
                <fieldset>
                  <legend className="block text-sm font-medium mb-3">Customization Options</legend>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="milestones" className="block text-sm font-medium mb-2">Milestones (comma-separated)</label>
                      <input 
                        id="milestones"
                        type="text"
                        value={data.milestones.join(', ')}
                        onChange={(e) => updateField('milestones', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="e.g., Initial Review, Evidence Collection, Final Report"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="proposed-features" className="block text-sm font-medium mb-2">Proposed Features (comma-separated)</label>
                      <input 
                        id="proposed-features"
                        type="text"
                        value={data.proposedFeatures.join(', ')}
                        onChange={(e) => updateField('proposedFeatures', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="e.g., AI Anomaly Detection, Real-time Reporting"
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </fieldset>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label htmlFor="investigation-assignee" className="block text-sm font-medium mb-3">Assign To</label>
                  <select 
                    id="investigation-assignee"
                    value={data.assignee}
                    onChange={(e) => updateField('assignee', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  >
                    <option value="">Auto-assign based on workload</option>
                    <option value="A. Smith">A. Smith (Sr. Investigator)</option>
                    <option value="J. Doe">J. Doe (Analyst)</option>
                    <option value="M. Lee">M. Lee (Manager)</option>
                  </select>
                </div>
                
                <div className="space-y-3">
                  <span className="block text-sm font-medium mb-3">Tags</span>
                  
                  {drafts.find(d => d.field === 'tags') && (
                    <DraftPreview 
                      draft={drafts.find(d => d.field === 'tags')!}
                      onAccept={() => acceptDraft('tags')}
                      onReject={() => rejectDraft('tags')}
                      className="mb-4"
                    />
                  )}

                  <div className="flex flex-wrap gap-2">
                    {['Urgent', 'VIP Client', 'Cross-border', 'Crypto', 'Structuring', 'KYC Fail'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const newTags = data.tags.includes(tag) 
                            ? data.tags.filter(t => t !== tag)
                            : [...data.tags, tag];
                          updateField('tags', newTags);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          data.tags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 space-y-4">
                  <h3 className="font-bold text-lg mb-4">Review Investigation</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Title</span>
                      <p className="font-semibold">{data.title || 'Untitled'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Country</span>
                      <p className="font-semibold">{COUNTRY_OPTIONS.find(c => c.id === data.selectedCountry)?.label || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Reconciliation Type</span>
                      <p className="font-semibold capitalize">{data.reconciliationType.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Calendar Format</span>
                      <p className="font-semibold capitalize">{data.selectedCalendarFormat}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Currency Format</span>
                      <p className="font-semibold">{data.selectedCurrencyFormat}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Decimal Format</span>
                      <p className="font-semibold capitalize">{data.selectedDecimalFormat}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Assigned To</span>
                      <p className="font-semibold">{data.assignee || 'Auto-assign'}</p>
                    </div>
                    {data.selectedDocuments.length > 0 && (
                      <div>
                        <span className="text-slate-500">Documents Included</span>
                        <div className="flex gap-2 mt-1">
                          {data.selectedDocuments.map(doc => (
                            <span key={doc} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{doc}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.milestones.length > 0 && (
                      <div>
                        <span className="text-slate-500">Milestones</span>
                        <div className="flex gap-2 mt-1">
                          {data.milestones.map(milestone => (
                            <span key={milestone} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">{milestone}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.proposedFeatures.length > 0 && (
                      <div>
                        <span className="text-slate-500">Proposed Features</span>
                        <div className="flex gap-2 mt-1">
                          {data.proposedFeatures.map(feature => (
                            <span key={feature} className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">{feature}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.tags.length > 0 && (
                      <div>
                        <span className="text-slate-500 text-sm">Tags</span>
                        <div className="flex gap-2 mt-1">
                          {data.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                   </div>
                 </div>
               </div>
             )}
           </div>

           {/* Approval Queue */}
           <div className="mt-6">
             <ApprovalQueue showHeader={false} maxHeight="200px" />
           </div>

           {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-between">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} /> Back
            </button>
            
            {step < 4 ? (
              <button
                onClick={() => canProceed() && setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                <Check size={18} /> Create Investigation
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default InvestigationWizard;
