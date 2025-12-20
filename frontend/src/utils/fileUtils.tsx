import React from 'react';
import { FileText, Image, Video, AudioWaveform, Database } from 'lucide-react';

/**
 * Returns the appropriate file icon based on file type
 * @param fileType - The file type or extension
 * @param className - Optional CSS classes for the icon
 * @returns React component for the file icon
 */
export const getFileIcon = (fileType?: string, className = "h-4 w-4"): JSX.Element => {
  const iconProps = { className };
  const type = fileType?.toLowerCase() || '';
  
  // Image files
  if (type.includes('image') || type.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/)) {
    return <Image {...iconProps} />;
  }
  
  // Video files
  if (type.includes('video') || type.match(/\.(mp4|avi|mov|wmv|flv|mkv)$/)) {
    return <Video {...iconProps} />;
  }
  
  // Audio files
  if (type.includes('audio') || type.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/)) {
    return <AudioWaveform {...iconProps} />;
  }
  
  // Document files
  if (type.includes('document') || type.includes('pdf') || type.includes('text') || type.match(/\.(pdf|doc|docx|txt|rtf|odt)$/)) {
    return <FileText {...iconProps} />;
  }
  
  // Default to database/generic icon
  return <Database {...iconProps} />;
};

/**
 * Returns the appropriate color class based on file type
 * @param fileType - The file type or extension
 * @returns Tailwind CSS color class
 */
export const getFileTypeColor = (fileType?: string): string => {
  const type = fileType?.toLowerCase() || '';
  
  if (type.includes('image') || type.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
    return 'text-blue-600';
  }
  
  if (type.includes('video') || type.match(/\.(mp4|avi|mov|wmv)$/)) {
    return 'text-purple-600';
  }
  
  if (type.includes('audio') || type.match(/\.(mp3|wav|ogg|flac)$/)) {
    return 'text-green-600';
  }
  
  if (type.includes('document') || type.includes('pdf') || type.includes('text') || type.match(/\.(pdf|doc|docx|txt)$/)) {
    return 'text-orange-600';
  }
  
  return 'text-gray-600';
};

/**
 * Check if a file is an image type
 * @param fileType - The file type or extension
 * @returns True if the file is an image
 */
export const isImageFile = (fileType: string): boolean => {
  return /image|png|jpg|jpeg|gif|webp|svg/.test(fileType.toLowerCase());
};

/**
 * Check if a file is a video type
 * @param fileType - The file type or extension
 * @returns True if the file is a video
 */
export const isVideoFile = (fileType: string): boolean => {
  return /video|mp4|avi|mov|wmv|mkv/.test(fileType.toLowerCase());
};

/**
 * Check if a file is an audio type
 * @param fileType - The file type or extension
 * @returns True if the file is an audio
 */
export const isAudioFile = (fileType: string): boolean => {
  return /audio|mp3|wav|ogg|flac|aac/.test(fileType.toLowerCase());
};

/**
 * Check if a file is a document type
 * @param fileType - The file type or extension
 * @returns True if the file is a document
 */
export const isDocumentFile = (fileType: string): boolean => {
  return /document|pdf|doc|docx|txt|rtf/.test(fileType.toLowerCase());
};
