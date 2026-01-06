import React from 'react';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { AlertTriangle, CheckCircle, Save, Send } from 'lucide-react';

import { useSARCreation } from '@/hooks/useSARCreation';
import { SelectCaseStep } from '@/components/compliance/sar/SelectCaseStep';
import { SARDetailsStep } from '@/components/compliance/sar/SARDetailsStep';
import { SARDraftsSidebar } from '@/components/compliance/sar/SARDraftsSidebar';

const SARCreationWizard: React.FC = () => {
  const {
    step,
    setStep,
    loading,
    casesLoading,
    casesError,
    searchQuery,
    setSearchQuery,
    selectedCase,
    error,
    success,
    formData,
    setFormData,
    filteredCases,
    handleCaseSelect,
    handleActivityToggle,
    handleSubmit
  } = useSARCreation();

  return (
    <div className="max-w-7xl mx-auto p-6 flex gap-8">
      {/* Sidebar drafts list for quick access */}
      <SARDraftsSidebar />

      <div className="flex-1 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SAR Creation Wizard</h1>
            <p className="text-gray-600 mt-2">Create a Suspicious Activity Report for regulatory filing</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm ${step === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
              Step {step} of 2
            </div>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <SelectCaseStep
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            casesLoading={casesLoading}
            casesError={casesError}
            filteredCases={filteredCases}
            handleCaseSelect={handleCaseSelect}
          />
        )}
        
        {step === 2 && (
          <SARDetailsStep
            formData={formData}
            setFormData={setFormData}
            selectedCase={selectedCase}
            setStep={setStep}
            handleActivityToggle={handleActivityToggle}
          />
        )}

        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
          >
            Previous
          </Button>

          <div className="flex space-x-3">
            {step === 1 && selectedCase && (
              <Button onClick={() => setStep(2)}>
                Next: SAR Details
              </Button>
            )}
            {step === 2 && (
              <>
                <Button variant="outline" onClick={handleSubmit} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Creating SAR...' : 'Create & Submit SAR'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SARCreationWizard;