// components/ui/FileDropZone.tsx
import React, { useState, useCallback, useRef } from "react";
import { Upload, File, X } from "lucide-react";

interface FileDropZoneProps {
  onFilesDropped: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  maxSizeInMB?: number; // Added for better UX guidance
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesDropped,
  accept = "*",
  multiple = true,
  className = "",
  maxSizeInMB = 10,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragging to false if we're leaving the container itself
    // (This prevents flickering when dragging over child elements)
    if (
      containerRef.current &&
      !containerRef.current.contains(e.relatedTarget as Node)
    ) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        setFiles(droppedFiles);
        onFilesDropped(droppedFiles);
      }
    },
    [onFilesDropped],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        setFiles(selectedFiles);
        onFilesDropped(selectedFiles);
      }
    },
    [onFilesDropped],
  );

  const triggerFileInput = () => {
    inputRef.current?.click();
  };

  const removeFile = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation(); // Prevent triggering the file input
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(newFiles);
    onFilesDropped(newFiles);
  };

  return (
    <div
      ref={containerRef}
      className={`file-drop-zone transition-all duration-200 ease-in-out border-2 border-dashed rounded-lg p-8 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isDragging
          ? "dragging border-blue-500 bg-blue-50 scale-[1.02]"
          : "border-gray-300 hover:border-blue-400 hover:bg-slate-50"
      } ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerFileInput}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerFileInput();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="File upload area. Drag and drop files here or press Enter to browse."
      aria-dropeffect="copy"
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        onClick={(e) => {
          // Reset value to allow selecting the same file again
          (e.target as HTMLInputElement).value = "";
        }}
      />

      <div className="drop-zone-content flex flex-col items-center justify-center gap-3 pointer-events-none">
        <div
          className={`p-4 rounded-full transition-colors ${isDragging ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
        >
          <Upload
            size={32}
            className={`transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}
          />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-medium text-gray-900">
            {isDragging
              ? "Drop files now"
              : "Drop files here or click to browse"}
          </h3>
          <p className="text-sm text-gray-500">
            Supports PDF, DOCX, CSV up to {maxSizeInMB}MB
          </p>
        </div>

        {files.length > 0 && (
          <div className="file-list mt-6 w-full max-w-md pointer-events-auto">
            <div className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Selected files
            </div>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="file-item flex items-center p-3 bg-white rounded-md border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2"
                  onClick={(e) => e.stopPropagation()} // Prevent triggering upload when interacting with file item
                >
                  <div className="bg-blue-50 p-2 rounded text-blue-600 mr-3">
                    <File size={16} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => removeFile(e, index)}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={`Remove ${file.name}`}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDropZone;
