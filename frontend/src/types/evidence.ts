export interface EvidenceMetadata {
  id: string;
  filename: string;
  fileType: string;
  size: number;
  hash: string;
  uploadedAt: string;
  uploadedBy: string;
  caseId?: string;
  chainOfCustody: CustodyEvent[];
  multimodalData?: MultimodalData;
  correlations: EvidenceCorrelation[];
  integrityVerified: boolean;
  lastAccessed: string;
  accessCount: number;
}

export interface CustodyEvent {
  id: string;
  timestamp: string;
  action: "upload" | "access" | "transfer" | "analysis" | "download" | "delete";
  user: string;
  location?: string;
  notes?: string;
  hash: string;
}

export interface MultimodalData {
  ocr?: string;
  faces?: FaceDetection[];
  objects?: ObjectDetection[];
  audioTranscript?: string;
  videoMetadata?: VideoMetadata;
  exif?: Record<string, any>;
  signatures?: DigitalSignature[];
}

export interface FaceDetection {
  id: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  landmarks?: { [key: string]: { x: number; y: number } };
  embedding?: number[];
}

export interface ObjectDetection {
  id: string;
  label: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface VideoMetadata {
  duration: number;
  resolution: string;
  frameRate: number;
  codec: string;
  scenes?: SceneDetection[];
}

export interface SceneDetection {
  timestamp: number;
  description: string;
  confidence: number;
}

export interface DigitalSignature {
  id: string;
  signer: string;
  certificate: string;
  timestamp: string;
  verified: boolean;
}

export interface EvidenceCorrelation {
  id: string;
  relatedEvidenceId: string;
  correlationType: "content" | "metadata" | "temporal" | "entity" | "semantic";
  confidence: number;
  description: string;
  detectedAt: string;
}
