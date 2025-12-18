// frontend/src/components/ui/MultiModalUpload.tsx
import React, { useState, useCallback } from 'react';
import { Upload, File, Image, FileText, Music, Video, Archive, X, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import './MultiModalUpload.css';

interface ProcessingResult {
  id?: string;
  url?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ElectronFile extends File {
  path?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: ProcessingResult;
  error?: string;
}

interface MultiModalUploadProps {
  onFilesProcessed?: (results: ProcessingResult[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

const FILE_TYPE_ICONS: Record<string, typeof File> = {
  image: Image,
  document: FileText,
  audio: Music,
  video: Video,
  archive: Archive,
  text: FileText,
  default: File
};

const FILE_TYPE_COLORS: Record<string, string> = {
  image: 'text-blue-600 bg-blue-50',
  document: 'text-red-600 bg-red-50',
  audio: 'text-purple-600 bg-purple-50',
  video: 'text-green-600 bg-green-50',
  archive: 'text-yellow-600 bg-yellow-50',
  text: 'text-gray-600 bg-gray-50',
  default: 'text-gray-600 bg-gray-50'
};

export function MultiModalUpload({
  onFilesProcessed,
  maxFiles = 10,
  maxFileSize = 50, // MB
  acceptedTypes = ['*'],
  className = ''
}: MultiModalUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    if (mimeType.startsWith('text/')) return 'text';
    return 'default';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes('*')) {
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });
      if (!isAccepted) {
        return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
      }
    }

    return null;
  };

  const processFile = async (file: File, fileId: string) => {
    try {
      // Update status to processing
      setUploadedFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: 'processing' as const } : f
      ));

      // Process the file using the evidence processor
      // Note: In Electron, files from file input have a path property
      const filePath = (file as ElectronFile).path || file.name;
      const result = (await api.processEvidence(filePath)) as unknown as ProcessingResult;

      // Update with results
      setUploadedFiles(prev => prev.map(f =>
        f.id === fileId ? {
          ...f,
          status: 'completed' as const,
          progress: 100,
          result
        } : f
      ));

      return result;
    } catch (error) {
      setUploadedFiles(prev => prev.map(f =>
        f.id === fileId ? {
          ...f,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Processing failed'
        } : f
      ));
      throw error;
    }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    if (uploadedFiles.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        alert(`${file.name}: ${validationError}`);
        continue;
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'uploading',
        progress: 0
      };

      newFiles.push(uploadedFile);
    }

    if (newFiles.length === 0) return;

    // Add files to state
    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Process files
    const results: ProcessingResult[] = [];
    for (const file of newFiles) {
      try {
        const result = await processFile(file as unknown as ElectronFile, file.id);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
      }
    }

    // Notify parent component
    if (results.length > 0 && onFilesProcessed) {
      onFilesProcessed(results);
    }
     
  }, [uploadedFiles, maxFiles, onFilesProcessed, validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const acceptedTypesString = acceptedTypes.includes('*')
    ? 'All files'
    : acceptedTypes.map(type => type.startsWith('.') ? type : type.split('/')[1]).join(', ');

  return (
    <div className={`multi-modal-upload ${className}`}>
      {/* Upload Area */}
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input-multi')?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById('file-input-multi')?.click();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <input
          id="file-input-multi"
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          aria-label="Upload files"
          title="Upload files"
        />

        <div className="upload-content">
          <Upload className="upload-icon" size={48} />
          <h3 className="upload-title">Drop files here or click to browse</h3>
          <p className="upload-subtitle">
            Supports images, documents, audio, video, and archives
          </p>
          <p className="upload-limits">
            Max {maxFiles} files, up to {maxFileSize}MB each
          </p>
          <p className="accepted-types">
            Accepted: {acceptedTypesString}
          </p>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="file-list">
          <h4 className="file-list-title">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="file-items">
            {uploadedFiles.map((file) => {
              const fileType = getFileType(file.type);
              const IconComponent = FILE_TYPE_ICONS[fileType] || FILE_TYPE_ICONS.default;
              const colorClass = FILE_TYPE_COLORS[fileType] || FILE_TYPE_COLORS.default;

              return (
                <div key={file.id} className="file-item">
                  <div className={`file-icon ${colorClass}`}>
                    <IconComponent size={20} />
                  </div>

                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      {formatFileSize(file.size)} • {fileType}
                    </div>

                    {file.status === 'processing' && (
                      <div className="file-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <span className="progress-text">Processing...</span>
                      </div>
                    )}

                    {file.status === 'completed' && (
                      <div className="file-status success">
                        <CheckCircle size={14} />
                        <span>Processed successfully</span>
                      </div>
                    )}

                    {file.status === 'error' && (
                      <div className="file-status error">
                        <AlertCircle size={14} />
                        <span>{file.error}</span>
                      </div>
                    )}
                  </div>

                  <button
                    className="file-remove"
                    onClick={() => removeFile(file.id)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}


    </div>
  );
}