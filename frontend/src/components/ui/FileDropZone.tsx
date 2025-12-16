// components/ui/FileDropZone.tsx
import React, { useState, useCallback } from 'react';
import { Upload, File } from 'lucide-react';

interface FileDropZoneProps {
  onFilesDropped: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesDropped,
  accept = "*",
  multiple = true,
  className = ""
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

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

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    onFilesDropped(droppedFiles);
  }, [onFilesDropped]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    onFilesDropped(selectedFiles);
  }, [onFilesDropped]);

  return (
    <div
      className={`file-drop-zone ${isDragging ? 'dragging' : ''} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          document.getElementById('file-input')?.click();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <input
        id="file-input"
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
      />

      <div className="drop-zone-content">
        <Upload size={48} className="upload-icon" />
        <h3>Drop files here or click to browse</h3>
        <p>Supported formats: PDF, DOCX, XLSX, CSV, JPG, PNG, TIFF</p>

        {files.length > 0 && (
          <div className="file-list">
            <h4>Selected files:</h4>
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <File size={16} />
                <span>{file.name}</span>
                <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDropZone;