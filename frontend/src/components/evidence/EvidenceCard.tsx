import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getFileIcon } from "@/utils/fileUtils";
import { formatFileSize } from "@/utils/formatters";

interface EvidenceItem {
  id: string;
  filename: string;
  fileType: string;
  size: number;
  hash: string;
  uploadedAt: string;
  lastAccessed: string;
  accessCount: number;
  integrityVerified: boolean;
  multimodalData?: {
    ocr?: string;
    faces?: any[];
    objects?: any[];
    videoMetadata?: any;
    audioTranscript?: string;
  };
}

interface EvidenceCardProps {
  evidence: EvidenceItem;
  isSelected?: boolean;
  onSelect: (evidence: EvidenceItem) => void;
}

const getFileTypeColor = (fileType: string) => {
  switch (fileType.toLowerCase()) {
    case "pdf":
    case "doc":
    case "docx":
      return "text-blue-600";
    case "jpg":
    case "png":
    case "gif":
      return "text-purple-600";
    case "mp4":
    case "mov":
      return "text-red-600";
    case "mp3":
    case "wav":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  isSelected = false,
  onSelect,
}) => {
  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
      onClick={() => onSelect(evidence)}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(evidence);
        }
      }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={getFileTypeColor(evidence.fileType)}>
              {getFileIcon(evidence.fileType)}
            </span>
            <CardTitle className="text-lg truncate">
              {evidence.filename}
            </CardTitle>
          </div>
          {evidence.integrityVerified && (
            <Shield className="h-5 w-5 text-green-500" />
          )}
        </div>
        <CardDescription className="flex items-center space-x-4 text-sm">
          <span>{formatFileSize(evidence.size)}</span>
          <span className="font-mono text-xs">
            {evidence.hash.slice(0, 8)}...
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Uploaded:</span>
            <span>{new Date(evidence.uploadedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last Accessed:</span>
            <span>{new Date(evidence.lastAccessed).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Access Count:</span>
            <span>{evidence.accessCount}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {evidence.multimodalData?.ocr && (
              <Badge variant="secondary">OCR</Badge>
            )}
            {evidence.multimodalData?.faces && (
              <Badge variant="secondary">Faces</Badge>
            )}
            {evidence.multimodalData?.objects && (
              <Badge variant="secondary">Objects</Badge>
            )}
            {evidence.multimodalData?.videoMetadata && (
              <Badge variant="secondary">Video</Badge>
            )}
            {evidence.multimodalData?.audioTranscript && (
              <Badge variant="secondary">Audio</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
