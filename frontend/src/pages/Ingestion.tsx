// pages/Ingestion.tsx
import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Play, X, Save, Database } from 'lucide-react';
import FileDropZone from '../components/ui/FileDropZone';
import ProgressBar from '../components/ui/ProgressBar';
import { AccessibleButton } from '../components/ui/AccessibleButton';
import { accessibilityManager } from '../lib/accessibility';
import { api } from '../lib/api';
import { TableData } from '../types/api';
import FacetedFilter from '../components/cases/FacetedFilter';
import { useToast } from '../providers/ToastProvider';
import { useIngestionStore, ProcessingResult } from '../stores/useIngestionStore';

interface FilterOption {
  id: string;
  label: string;
  type: 'checkbox' | 'slider' | 'select' | 'search';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
}

const renderTable = (table: TableData) => (
  <div className="overflow-x-auto my-4">
    <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg">
      <thead className="bg-gray-50">
        <tr>
          {table.headers.map((header, idx) => (
            <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {table.rows.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((cell, cellIdx) => (
              <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Ingestion: React.FC = () => {
  const {
    files,
    processingResults,
    isProcessing,
    filters,
    addFiles,
    setProcessingResults,
    setIsProcessing,
    setFilters
  } = useIngestionStore();

  const [isSaving, setIsSaving] = useState(false);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  const handleFilesDropped = (droppedFiles: File[]) => {
    addFiles(droppedFiles);
    const newResults: ProcessingResult[] = droppedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
      isPaused: false,
      isCancellable: true,
      isSaved: false
    }));
    setProcessingResults(prev => [...prev, ...newResults]);
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
        const error = err instanceof Error ? err : new Error('Processing failed');
        setProcessingResults(prev => prev.map((res, index) =>
          index === i ? {
            ...res,
            status: 'error',
            progress: 100,
            error: error.message || 'Processing failed'
          } : res
        ));

        accessibilityManager.announce(`${file.name} processing failed: ${error.message}`, 'assertive');
      }
    }

    setIsProcessing(false);
    accessibilityManager.announce('File processing completed', 'polite');
  };

  // New function to save completed items to the case
  const handleSaveToCase = async () => {
    const defaultCaseId = 'CASE-001'; // Defaulting to CASE-001 as per current app context
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
        } catch (error) {
            console.error(`Failed to save ${item.file.name}:`, error);
            addToast(`Failed to save ${item.file.name}. It may already exist or backend is unavailable.`, 'error');
        }
    }

    setIsSaving(false);
    if (savedCount > 0) {
        addToast(`Successfully saved ${savedCount} files to Case ${defaultCaseId}`, 'success');
        accessibilityManager.announce('Evidence saved successfully', 'polite');
    }
  };

  const getStatusIcon = (status: string, isSaved: boolean = false) => {
    if (isSaved) return <Database size={16} className="text-blue-600" aria-label="Saved to database" />;
    
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" aria-hidden="true" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" aria-hidden="true" />;
      case 'processing':
        return (
          <div
            className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
            aria-hidden="true"
          />
        );
      case 'paused':
        return <Play size={16} className="text-blue-400" aria-hidden="true" />;
      case 'cancelled':
        return <X size={16} className="text-gray-400" aria-hidden="true" />;
      default:
        return <FileText size={16} className="text-gray-400" aria-hidden="true" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'processing': return 'text-blue-600';
      case 'paused': return 'text-blue-400';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string, isSaved: boolean = false) => {
    if (isSaved) return 'Saved to Evidence';
    switch (status) {
      case 'completed': return 'Processing completed';
      case 'error': return 'Processing failed';
      case 'processing': return 'Processing in progress';
      case 'pending': return 'Waiting to process';
      case 'paused': return 'Processing paused';
      case 'cancelled': return 'Processing cancelled';
      default: return 'Unknown status';
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

  // Calculate if we have any unsaved completed items
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
                <article
                  key={index}
                  className={`result-item bg-white dark:bg-slate-900 shadow-sm rounded-lg p-4 border ${result.isSaved ? 'border-green-500 ring-1 ring-green-100 dark:ring-green-900' : 'border-slate-200 dark:border-slate-800'}`}
                  aria-labelledby={`result-file-${index}`}
                  aria-describedby={`result-status-${index}`}
                >
                  <header className="result-header flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                    {getStatusIcon(result.status, result.isSaved)}
                      <span id={`result-file-${index}`} className="file-name text-lg font-medium text-slate-900 dark:text-white">
                      {result.file.name}
                    </span>
                      <span className="text-slate-500 text-sm ml-2">Queue: #{index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {result.isSaved && (
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                                SAVED
                            </span>
                        )}
                        <span
                          id={`result-status-${index}`}
                          className={`status-text px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(result.status)}`}
                          role="status"
                          aria-label={getStatusLabel(result.status, result.isSaved)}
                        >
                          {result.status}
                        </span>
                    </div>
                  </header>

                  <ProgressBar
                    progress={result.progress}
                    color={
                      result.status === 'completed' ? 'success' :
                      result.status === 'error' ? 'error' :
                      result.status === 'processing' ? 'primary' : 'primary'
                    }
                    aria-label={`Processing progress for ${result.file.name}: ${result.progress}%`}
                    className="mb-3"
                  />

                  <div className="flex gap-2 mb-3">
                    {result.status === 'processing' && (
                      <AccessibleButton
                        onClick={() => handlePause(index)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 text-xs py-1 px-2"
                      >
                        <Play size={14} className="rotate-180" /> Pause
                      </AccessibleButton>
                    )}
                    {result.status === 'paused' && (
                      <AccessibleButton
                        onClick={() => handleResume(index)}
                        className="bg-green-500 hover:bg-green-600 text-white border-0 text-xs py-1 px-2"
                      >
                        <Play size={14} /> Resume
                      </AccessibleButton>
                    )}
                    {result.isCancellable && result.status !== 'cancelled' && result.status !== 'completed' && (
                      <AccessibleButton
                        onClick={() => handleCancel(index)}
                        className="bg-gray-500 hover:bg-gray-600 text-white border-0 text-xs py-1 px-2"
                      >
                        <X size={14} /> Cancel
                      </AccessibleButton>
                    )}
                  </div>

                  {result.error && (
                    <div className="error-message flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded-md" role="alert" aria-live="assertive">
                      <AlertCircle size={18} aria-hidden="true" />
                      <span>{result.error}</span>
                    </div>
                  )}

                  {result.result && (
                    <div className="result-details mt-4 p-4 border rounded-md bg-gray-50 dark:bg-slate-800">
                      <div className="detail-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="detail-item">
                          <span className="label font-semibold">File Type:</span>
                          <span className="value ml-2">{result.result.fileType}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label font-semibold">Size:</span>
                          <span className="value ml-2" aria-label={`${result.result.sizeBytes} bytes`}>
                            {result.result.sizeBytes}
                          </span>
                        </div>

                        {result.result.document_type && (
                          <div className="detail-item md:col-span-2">
                            <span className="label font-semibold">Document Type:</span>
                            <span className="value ml-2 capitalize">{result.result.document_type.replace(/_/g, ' ')}</span>
                          </div>
                        )}

                        {result.result.ocrText && (
                          <div className="detail-item md:col-span-2">
                            <span className="label font-semibold">OCR Text (excerpt):</span>
                            <div
                              className="value ocr-text mt-1 p-2 bg-white border rounded text-sm max-h-24 overflow-y-auto"
                              aria-label="Extracted text content"
                            >
                              {result.result.ocrText.substring(0, 500)}...
                            </div>
                          </div>
                        )}
                        
                        {result.result.bank_statement_data && result.result.document_type === "bank_statement" && (
                          <div className="detail-item md:col-span-1 border-r pr-4">
                            <h3 className="text-lg font-bold mb-2">Bank Statement Data</h3>
                            {result.result.bank_statement_data.account_summary && (
                              <div className="mb-2">
                                <p className="font-semibold">Account Summary:</p>
                                {Object.entries(result.result.bank_statement_data.account_summary).map(([key, value]) => (
                                  <p key={key} className="text-sm capitalize">{key.replace(/_/g, ' ')}: {String(value)}</p>
                                ))}
                              </div>
                            )}
                            {result.result.bank_statement_data.transactions && result.result.bank_statement_data.transactions.length > 0 && (
                              <div>
                                <p className="font-semibold mb-1">Transactions:</p>
                                <div className="max-h-60 overflow-y-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {result.result.bank_statement_data.transactions.map((txn: any, txnIdx: number) => (
                                        <tr key={txnIdx}>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{txn.date}</td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{txn.description}</td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{txn.amount}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {result.result.expense_data && result.result.document_type === "expense_report" && (
                          <div className="detail-item md:col-span-1 pl-4">
                            <h3 className="text-lg font-bold mb-2">Expense Data</h3>
                            {result.result.expense_data.total_amount && (
                              <p className="font-semibold mb-2">Total Amount: {result.result.expense_data.total_amount}</p>
                            )}
                            {result.result.expense_data.items && result.result.expense_data.items.length > 0 && (
                              <div>
                                <p className="font-semibold mb-1">Expense Items:</p>
                                <div className="max-h-60 overflow-y-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {result.result.expense_data.items.map((item: any, itemIdx: number) => (
                                        <tr key={itemIdx}>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.item}</td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.amount}</td>
                                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {result.result.extracted_tables && result.result.extracted_tables.length > 0 && result.result.document_type === "general_document" && (
                          <div className="detail-item md:col-span-2">
                            <h3 className="text-lg font-bold mb-2">Extracted Tables</h3>
                            {result.result.extracted_tables.map((table, tableIdx) => (
                              <div key={tableIdx} className="mb-4 p-2 border rounded bg-white">
                                {renderTable(table)}
                              </div>
                            ))}
                          </div>
                        )}
                        
                      </div>
                    </div>
                  )}
                </article>
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