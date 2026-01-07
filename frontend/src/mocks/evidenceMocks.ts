import { EvidenceMetadata } from "@/types/evidence";

export const MOCK_EVIDENCE: EvidenceMetadata[] = [
  {
    id: "ev-001",
    filename: "bank_statement.pdf",
    fileType: "pdf",
    size: 2457600,
    hash: "a1b2c3d4e5f6...",
    uploadedAt: "2025-12-15T10:30:00Z",
    uploadedBy: "investigator@example.com",
    caseId: "CASE-2025-001",
    chainOfCustody: [
      {
        id: "cust-001",
        timestamp: "2025-12-15T10:30:00Z",
        action: "upload",
        user: "investigator@example.com",
        notes: "Initial evidence upload",
        hash: "a1b2c3d4e5f6...",
      },
      {
        id: "cust-002",
        timestamp: "2025-12-15T14:20:00Z",
        action: "analysis",
        user: "analyst@example.com",
        notes: "OCR processing completed",
        hash: "a1b2c3d4e5f6...",
      },
    ],
    multimodalData: {
      ocr: "BANK STATEMENT\nAccount: ****1234\nBalance: $45,230.67\nRecent transactions...",
      signatures: [
        {
          id: "sig-001",
          signer: "John Doe",
          certificate: "CN=John Doe,O=Bank,C=US",
          timestamp: "2025-12-15T10:30:00Z",
          verified: true,
        },
      ],
    },
    correlations: [
      {
        id: "corr-001",
        relatedEvidenceId: "ev-002",
        correlationType: "content",
        confidence: 0.89,
        description: "Shared account number with wire transfer document",
        detectedAt: "2025-12-15T14:25:00Z",
      },
    ],
    integrityVerified: true,
    lastAccessed: "2025-12-15T16:45:00Z",
    accessCount: 12,
  },
  {
    id: "ev-002",
    filename: "wire_transfer_receipt.jpg",
    fileType: "image",
    size: 1843200,
    hash: "f6e5d4c3b2a1...",
    uploadedAt: "2025-12-15T11:15:00Z",
    uploadedBy: "investigator@example.com",
    caseId: "CASE-2025-001",
    chainOfCustody: [
      {
        id: "cust-003",
        timestamp: "2025-12-15T11:15:00Z",
        action: "upload",
        user: "investigator@example.com",
        notes: "Wire transfer receipt upload",
        hash: "f6e5d4c3b2a1...",
      },
    ],
    multimodalData: {
      ocr: "WIRE TRANSFER RECEIPT\nAmount: $25,000.00\nFrom: Account ****1234\nTo: External Account",
      objects: [
        {
          id: "obj-001",
          label: "document",
          confidence: 0.95,
          boundingBox: { x: 50, y: 50, width: 400, height: 300 },
        },
        {
          id: "obj-002",
          label: "signature",
          confidence: 0.87,
          boundingBox: { x: 150, y: 280, width: 100, height: 40 },
        },
      ],
      faces: [
        {
          id: "face-001",
          confidence: 0.92,
          boundingBox: { x: 200, y: 100, width: 80, height: 80 },
          landmarks: {
            left_eye: { x: 220, y: 120 },
            right_eye: { x: 250, y: 120 },
            nose: { x: 235, y: 135 },
            mouth: { x: 235, y: 150 },
          },
        },
      ],
      exif: {
        camera: "iPhone 13 Pro",
        timestamp: "2025-12-15T11:10:00Z",
        location: "40.7128,-74.0060",
      },
    },
    correlations: [
      {
        id: "corr-002",
        relatedEvidenceId: "ev-001",
        correlationType: "content",
        confidence: 0.89,
        description: "Matching account number with bank statement",
        detectedAt: "2025-12-15T14:25:00Z",
      },
    ],
    integrityVerified: true,
    lastAccessed: "2025-12-15T15:30:00Z",
    accessCount: 8,
  },
  {
    id: "ev-003",
    filename: "security_footage.mp4",
    fileType: "video",
    size: 157286400,
    hash: "9h8g7f6e5d4...",
    uploadedAt: "2025-12-15T12:00:00Z",
    uploadedBy: "security@example.com",
    caseId: "CASE-2025-001",
    chainOfCustody: [
      {
        id: "cust-004",
        timestamp: "2025-12-15T12:00:00Z",
        action: "upload",
        user: "security@example.com",
        notes: "ATM security footage",
        hash: "9h8g7f6e5d4...",
      },
    ],
    multimodalData: {
      videoMetadata: {
        duration: 300,
        resolution: "1920x1080",
        frameRate: 30,
        codec: "H.264",
        scenes: [
          {
            timestamp: 45,
            description: "Person approaching ATM",
            confidence: 0.85,
          },
          {
            timestamp: 120,
            description: "Transaction in progress",
            confidence: 0.92,
          },
        ],
      },
      faces: [
        {
          id: "face-002",
          confidence: 0.88,
          boundingBox: { x: 800, y: 400, width: 120, height: 120 },
        },
      ],
    },
    correlations: [
      {
        id: "corr-003",
        relatedEvidenceId: "ev-002",
        correlationType: "temporal",
        confidence: 0.76,
        description: "Timestamp matches wire transfer time",
        detectedAt: "2025-12-15T15:00:00Z",
      },
    ],
    integrityVerified: true,
    lastAccessed: "2025-12-15T15:00:00Z",
    accessCount: 5,
  },
];
