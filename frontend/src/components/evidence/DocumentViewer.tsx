import React, { useState } from 'react';
import { Upload, FileText, Image, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface ProcessedDocument {
  success: boolean;
  document_id?: string;
  filename: string;
  file_type?: string;
  extracted_text?: string;
  metadata?: Record<string, any>;
  entities?: Array<{ type: string; value: string; confidence: number }>;
  confidence?: number;
  error?: string;
}

export const DocumentViewer: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedDocument[]>([]);
  const [selectedResult, setSelectedResult] = useState<ProcessedDocument | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const processDocuments = async () => {
    setProcessing(true);
    const formData = new FormData();
    
    if (files.length === 1) {
      formData.append('file', files[0]);
      
      try {
        const response = await fetch('/api/v1/ocr/process', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        setResults([result]);
        setSelectedResult(result);
      } catch (error) {
        console.error('Processing failed:', error);
      }
    } else {
      // Batch processing
      files.forEach(file => formData.append('files', file));
      
      try {
        const response = await fetch('/api/v1/ocr/batch-process', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        setResults(data.results || []);
        if (data.results?.length > 0) {
          setSelectedResult(data.results[0]);
        }
      } catch (error) {
        console.error('Batch processing failed:', error);
      }
    }
    
    setProcessing(false);
  };

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="text-red-500" />;
      case 'image':
        return <Image className="text-blue-500" />;
      default:
        return <File className="text-slate-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Document Processing
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload documents for OCR and text extraction
        </p>
      </div>

      {/* Upload Area */}
      <div className="p-6">
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
          <Upload className="mx-auto mb-4 text-slate-400" size={48} />
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Drag and drop files here, or click to select
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            accept=".pdf,.jpg,.jpeg,.png,.txt"
          />
          <label
            htmlFor="file-upload"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
          >
            Select Files
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
              Selected Files ({files.length})
            </h3>
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <File size={16} />
                  <span>{file.name}</span>
                  <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
            <button
              onClick={processDocuments}
              disabled={processing}
              className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-slate-400 transition-colors"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <Loader className="animate-spin" size={16} />
                  Processing...
                </span>
              ) : (
                'Process Documents'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="flex-1 flex overflow-hidden">
          {/* Results List */}
          <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">
                Processed Documents
              </h3>
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedResult(result)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedResult === result
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {getFileIcon(result.file_type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-slate-900 dark:text-white">
                          {result.filename}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {result.success ? (
                            <>
                              <CheckCircle size={14} className="text-green-500" />
                              <span className="text-xs text-green-600 dark:text-green-400">
                                {(result.confidence! * 100).toFixed(0)}% confidence
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={14} className="text-red-500" />
                              <span className="text-xs text-red-600 dark:text-red-400">Failed</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail View */}
          {selectedResult && (
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                {selectedResult.filename}
              </h3>

              {selectedResult.success ? (
                <>
                  {/* Metadata */}
                  {selectedResult.metadata && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Metadata</h4>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        {Object.entries(selectedResult.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-400">{key}:</span>
                            <span className="font-mono text-slate-900 dark:text-white">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Entities */}
                  {selectedResult.entities && selectedResult.entities.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">
                        Extracted Entities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedResult.entities.map((entity, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                          >
                            <span className="font-semibold">{entity.type}:</span> {entity.value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Text */}
                  {selectedResult.extracted_text && (
                    <div>
                      <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">
                        Extracted Text
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap text-slate-900 dark:text-white">
                        {selectedResult.extracted_text}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                  <p className="text-red-600 dark:text-red-400">
                    Processing failed: {selectedResult.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
