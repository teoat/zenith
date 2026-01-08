// pages/Ingestion.tsx
import React, { useState } from 'react';
import { Play, Save } from 'lucide-react';
import FileDropZone from '@/components/ui/FileDropZone';
import { AccessibleButton } from '@/components/ui/AccessibleButton';
import { accessibilityManager } from '@/lib/accessibility';
import { api } from '@/lib/api';
import FacetedFilter from '@/components/cases/FacetedFilter';
import { useToast } from '@/providers/ToastProvider';
import { ProcessingResult } from '@/types/ingestion';
import { ProcessingResultItem } from '@/components/features/ingestion/ProcessingResultItem';

interface FilterOption {
  id: string;
  label: string;
  type: 'checkbox' | 'slider' | 'select' | 'search';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  defaultValue?: string | string[] | number | boolean;
}

const Ingestion: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | string[] | number | boolean>>({});
  const { addToast } = useToast();

  const filterOptions: FilterOption[] = [
    {
      id: 'documentType',
      label: 'Document Type',
      type: 'checkbox',
      options: [
        { value: 'bank_statement', label: 'Bank Statement' },
        { value: 'expense_report', label: 'Expense Report' },
        { value: 'general_document', label: 'General Document' },
        { value: 'image', label: 'Image' },
        { value: 'text', label: 'Text' },
      ],
    },
    {
      id: 'status',
      label: 'Processing Status',
      type: 'checkbox',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'error', label: 'Error' },
        { value: 'paused', label: 'Paused' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      id: 'minSize',
      label: 'Minimum Size (bytes)',
      type: 'slider',
      min: 0,
      max: 1000000, // 1MB
      defaultValue: 0,
    },
    {
      id: 'searchTerm',
      label: 'Search',
      type: 'search',
    },
  ];

  const handleFilterChange = (newFilters: Record<string, string | string[] | number | boolean>) => {
    setFilters(newFilters);
  };

  const handleFilesDropped = (droppedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
    const newResults = droppedFiles.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0,
      isPaused: false,
      isCancellable: true,
      isSaved: false
    }));
    setProcessingResults(prevResults => [...prevResults, ...newResults]);
    accessibilityManager.announce(`${droppedFiles.length} files selected for processing`, 'polite');
  };

  const handlePause = (index: number) => {
    setProcessingResults(prev => prev.map((result, i) => 
      i === index ? { ...result, status: 'paused', isPaused: true } : result
    ));
    accessibilityManager.announce(`Processing for ${processingResults[index].file.name} paused`, 'polite');
  };

  const handleResume = (index: number) => {
    setProcessingResults(prev => prev.map((result, i) => 
      i === index ? { ...result, status: 'processing', isPaused: false } : result
    ));
    accessibilityManager.announce(`Processing for ${processingResults[index].file.name} resumed`, 'polite');
  };

  const handleCancel = (index: number) => {
    setProcessingResults(prev => prev.map((result, i) => 
      i === index ? { ...result, status: 'cancelled', isCancellable: false, progress: 0 } : result
    ));
    accessibilityManager.announce(`Processing for ${processingResults[index].file.name} cancelled`, 'polite');
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    accessibilityManager.announce('Starting file processing', 'polite');

    for (let i = 0; i < files.length; i++) {
      const currentResult = processingResults[i];
      if (currentResult.isPaused || currentResult.status === 'cancelled' || currentResult.status === 'completed') {
        continue;
      }

      const file = files[i];

      setProcessingResults(prev => prev.map((result, index) =>
        index === i ? { ...result, status: 'processing', progress: 10 } : result
      ));

      accessibilityManager.announce(`Processing ${file.name}`, 'polite');

      try {
        const result = await api.analyzeFile(file);

        setProcessingResults(prev => prev.map((res, index) =>
          index === i ? {
            ...res,
            status: 'completed',
            progress: 100,
            result: {
                fileType: result.file_info?.file_type || 'unknown',
                sizeBytes: result.file_info?.size_bytes || 0,
                ocrText: result.text_analysis?.extracted_text || '',
                extracted_tables: result.text_analysis?.extracted_tables || [],
                document_type: result.document_type,
                bank_statement_data: result.bank_statement_data,
                expense_data: result.expense_data
            }
          } : res
        ));

        accessibilityManager.announce(`${file.name} processing completed successfully`, 'polite');
      } catch (err) {
        setProcessingResults(prev => prev.map((res, index) =>
          index === i ? {
            ...res,
            status: 'error',
            progress: 100,
            error: err instanceof Error ? err.message : 'Processing failed'
          } : res
        ));

        accessibilityManager.announce(`${file.name} processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'assertive');
      }
    }

    setIsProcessing(false);
    accessibilityManager.announce('File processing completed', 'polite');
  };

  const handleSaveToCase = async () => {
    const defaultCaseId = 'CASE-001';
    const unsavedItemsIndices = processingResults
      .map((r, idx) => ({ ...r, index: idx }))
      .filter(r => r.status === 'completed' && !r.isSaved);

    if (unsavedItemsIndices.length === 0) {
        addToast('No new completed items to save.', 'info');
        return;
    }

    setIsSaving(true);
    accessibilityManager.announce('Saving evidence to case...', 'polite');

    let savedCount = 0;

    for (const item of unsavedItemsIndices) {
        try {
            const savedEvidence = await api.uploadEvidence(defaultCaseId, item.file);
            
            setProcessingResults(prev => prev.map((res, idx) => 
                idx === item.index ? { 
                    ...res, 
                    isSaved: true, 
                    savedId: savedEvidence.id 
                } : res
            ));
            savedCount++;
        } catch (err) {
            console.error(`Failed to save ${item.file.name}:`, err);
            addToast(`Failed to save ${item.file.name}. It may already exist or backend is unavailable.`, 'error');
        }
    }

    setIsSaving(false);
    if (savedCount > 0) {
        addToast(`Successfully saved ${savedCount} files to Case ${defaultCaseId}`, 'success');
        accessibilityManager.announce('Evidence saved successfully', 'polite');
    }
  };

  const filteredResults = processingResults.filter(result => {
    if (filters.documentType && filters.documentType.length > 0) {
      if (!result.result?.document_type || !filters.documentType.includes(result.result.document_type)) {
        return false;
      }
    }
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(result.status)) {
        return false;
      }
    }
    if (filters.minSize !== undefined && result.result) {
      if (result.result.sizeBytes < filters.minSize) {
        return false;
      }
    }
    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const matchesFileName = result.file.name.toLowerCase().includes(searchTermLower);
      const matchesOcrText = result.result?.ocrText?.toLowerCase().includes(searchTermLower);
      if (!matchesFileName && !matchesOcrText) {
        return false;
      }
    }
    return true;
  });

  const hasUnsavedCompletedItems = processingResults.some(r => r.status === 'completed' && !r.isSaved);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Left Pane: Faceted Filter */}
      <div className="w-1/4 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto shrink-0">
        <FacetedFilter
          filterOptions={filterOptions}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Right Pane: Ingestion Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6">
        <header className="page-header mb-6">
          <h1 className="text-3xl font-bold">Data Ingestion</h1>
          <p className="text-slate-600 dark:text-slate-400">Upload and process evidence files for fraud detection analysis</p>
        </header>

        <section className="upload-section mb-6" aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="sr-only">File Upload</h2>

          <FileDropZone
            onFilesDropped={handleFilesDropped}
            accept=".pdf,.docx,.xlsx,.csv,.jpg,.jpeg,.png,.tiff"
            multiple={true}
          />

          <div className="action-section mt-4 flex gap-4">
            {files.length > 0 && (
              <AccessibleButton
                onClick={processFiles}
                disabled={isProcessing}
                loading={isProcessing}
                loadingText="Processing files..."
                aria-describedby="process-files-description"
              >
                <Play size={16} aria-hidden="true" />
                {isProcessing ? 'Processing...' : 'Process Files'}
              </AccessibleButton>
            )}

            {hasUnsavedCompletedItems && (
              <AccessibleButton
                onClick={handleSaveToCase}
                disabled={isSaving || isProcessing}
                loading={isSaving}
                loadingText="Saving..."
                variant="primary"
                className="bg-green-600 hover:bg-green-700 text-white" 
              >
                <Save size={16} aria-hidden="true" />
                Save to Case
              </AccessibleButton>
            )}
            
            <div id="process-files-description" className="sr-only">
              Process the selected files for fraud detection analysis
            </div>
          </div>
        </section>

        {filteredResults.length > 0 && (
          <section className="results-section flex-1 overflow-y-auto" aria-labelledby="results-heading">
            <h2 id="results-heading" className="text-2xl font-bold mb-4">Processing Results ({filteredResults.length} filtered)</h2>
            <div className="results-list space-y-4" role="log" aria-live="polite" aria-atomic="false">
              {filteredResults.map((result, index) => (
                <ProcessingResultItem
                    key={index}
                    result={result}
                    index={index}
                    onPause={handlePause}
                    onResume={handleResume}
                    onCancel={handleCancel}
                />
              ))}
            </div>
          </section>
        )}
        {filteredResults.length === 0 && processingResults.length > 0 && (
          <p className="p-4 text-center text-slate-500 dark:text-slate-400">No results match your current filters.</p>
        )}
        {processingResults.length === 0 && (
          <p className="p-4 text-center text-slate-500 dark:text-slate-400">Upload files to see processing results.</p>
        )}
      </div>
    </div>
  );
};

export default Ingestion;