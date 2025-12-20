import React, { useState, useCallback } from 'react';
import { useEvidenceUpload } from '../../hooks/useEvidence';

interface EvidenceUploaderProps {
  caseId: string;
  onUploadComplete?: (evidence: any) => void;
  onUploadError?: (error: Error) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
}

export default function EvidenceUploader({
  caseId,
  onUploadComplete,
  onUploadError,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  maxFileSize = 10 * 1024 * 1024 // 10MB
}: EvidenceUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const uploadMutation = useEvidenceUpload();

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`;
    }

    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.match(type.replace('*', '.*'));
    });

    if (!isAccepted) {
      return `File type not accepted. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  }, [acceptedTypes, maxFileSize]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const validationErrors: string[] = [];

    selectedFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    setFiles(prev => [...prev, ...validFiles]);
    setErrors(validationErrors);
  }, [validateFile]);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setUploading(true);
    setErrors([]);

    try {
      const uploadPromises = files.map(async (file) => {
        try {
          const result = await uploadMutation.mutateAsync({
            caseId,
            file
          });
          onUploadComplete?.(result);
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          setErrors(prev => [...prev, `${file.name}: ${errorMessage}`]);
          onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
          return null;
        }
      });

      await Promise.allSettled(uploadPromises);

      // Clear successful uploads
      setFiles([]);
      setProgress({});
    } catch (error) {
      console.error('Upload process failed:', error);
    } finally {
      setUploading(false);
    }
  }, [files, caseId, uploadMutation, onUploadComplete, onUploadError]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Upload Evidence</h3>

      {/* File Input */}
      <div className="mb-4">
        <label htmlFor="evidence-upload" className="block text-sm font-medium text-gray-700 mb-2">
          Select Files
        </label>
        <input
          id="evidence-upload"
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Accepted types: {acceptedTypes.join(', ')} | Max size: {maxFileSize / (1024 * 1024)}MB
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  {progress[file.name] !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress[file.name]}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">Upload Errors:</h4>
              <ul className="text-sm text-red-700">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={clearErrors}
              className="text-red-500 hover:text-red-700"
              aria-label="Clear errors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}