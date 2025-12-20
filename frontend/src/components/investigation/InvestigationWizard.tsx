import React, { useState } from 'react';
import { useCaseStore } from '../store/caseStore';

interface InvestigationWizardProps {
  onComplete?: (investigation: any) => void;
  onCancel?: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

const BasicInfoStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Investigation Title
      </label>
      <input
        type="text"
        value={data.title || ''}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter investigation title"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
        value={data.description || ''}
        onChange={(e) => onChange({ ...data, description: e.target.value })}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Describe the investigation"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Priority Level
      </label>
      <select
        value={data.priority || 'medium'}
        onChange={(e) => onChange({ ...data, priority: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
    </div>
  </div>
);

const EvidenceStep: React.FC<{ data: any; onChange: (data: any) => void }> = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Evidence Types to Collect
      </label>
      <div className="space-y-2">
        {['Documents', 'Emails', 'Financial Records', 'Digital Media', 'Witness Statements'].map((type) => (
          <label key={type} className="flex items-center">
            <input
              type="checkbox"
              checked={data.evidenceTypes?.includes(type) || false}
              onChange={(e) => {
                const types = data.evidenceTypes || [];
                if (e.target.checked) {
                  onChange({ ...data, evidenceTypes: [...types, type] });
                } else {
                  onChange({ ...data, evidenceTypes: types.filter((t: string) => t !== type) });
                }
              }}
              className="mr-2"
            />
            {type}
          </label>
        ))}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Investigation Scope
      </label>
      <select
        value={data.scope || 'local'}
        onChange={(e) => onChange({ ...data, scope: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="local">Local Investigation</option>
        <option value="regional">Regional Investigation</option>
        <option value="national">National Investigation</option>
        <option value="international">International Investigation</option>
      </select>
    </div>
  </div>
);

const ReviewStep: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-4">
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium text-gray-900 mb-2">Investigation Summary</h3>
      <dl className="space-y-1 text-sm">
        <div><dt className="font-medium inline">Title:</dt> <dd className="inline ml-1">{data.title || 'Not specified'}</dd></div>
        <div><dt className="font-medium inline">Priority:</dt> <dd className="inline ml-1 capitalize">{data.priority || 'medium'}</dd></div>
        <div><dt className="font-medium inline">Scope:</dt> <dd className="inline ml-1 capitalize">{data.scope || 'local'}</dd></div>
        <div><dt className="font-medium inline">Evidence Types:</dt> <dd className="inline ml-1">{data.evidenceTypes?.join(', ') || 'None selected'}</dd></div>
      </dl>
    </div>

    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
      <ul className="text-sm text-blue-800 space-y-1">
        <li>• Create investigation case in the system</li>
        <li>• Assign team members and resources</li>
        <li>• Set up evidence collection protocols</li>
        <li>• Establish communication channels</li>
      </ul>
    </div>
  </div>
);

const steps: WizardStep[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Provide basic details about the investigation',
    component: BasicInfoStep
  },
  {
    id: 'evidence',
    title: 'Evidence Planning',
    description: 'Define what evidence will be collected',
    component: EvidenceStep
  },
  {
    id: 'review',
    title: 'Review & Confirm',
    description: 'Review your investigation setup',
    component: ReviewStep
  }
];

export default function InvestigationWizard({ onComplete, onCancel }: InvestigationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<any>({});
  const { createCase } = useCaseStore();

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Create the investigation case
      const investigationCase = await createCase({
        title: wizardData.title,
        description: wizardData.description,
        priority: wizardData.priority || 'medium',
        status: 'open',
        tags: ['investigation', ...(wizardData.evidenceTypes || [])]
      });

      onComplete?.({
        ...wizardData,
        caseId: investigationCase.id,
        createdAt: investigationCase.createdAt
      });
    } catch (error) {
      console.error('Failed to create investigation:', error);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic info
        return wizardData.title && wizardData.title.trim().length > 0;
      case 1: // Evidence
        return true; // Optional step
      case 2: // Review
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">New Investigation Setup</h1>
        <p className="text-gray-600">Follow the steps below to set up your investigation properly.</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index < currentStep ? '✓' : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">{currentStepData.title}</h2>
          <p className="text-gray-600">{currentStepData.description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8 min-h-[300px]">
        <StepComponent data={wizardData} onChange={setWizardData} />
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={currentStep === 0 ? onCancel : handlePrevious}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === steps.length - 1 ? 'Create Investigation' : 'Next'}
        </button>
      </div>
    </div>
  );
}