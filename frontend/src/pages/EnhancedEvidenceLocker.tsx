import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Image,
  Video,
  AudioWaveform,
  Database,
  Search,
  Upload,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Hash,
  Settings,
  Network,
  Zap
} from 'lucide-react';

interface EvidenceMetadata {
  id: string;
  filename: string;
  fileType: string;
  size: number;
  hash: string;
  uploadedAt: string;
  uploadedBy: string;
  caseId?: string;
  chainOfCustody: CustodyEvent[];
  multimodalData?: {
    ocr?: string;
    faces?: FaceDetection[];
    objects?: ObjectDetection[];
    audioTranscript?: string;
    videoMetadata?: VideoMetadata;
    exif?: Record<string, any>;
    signatures?: DigitalSignature[];
  };
  correlations: EvidenceCorrelation[];
  integrityVerified: boolean;
  lastAccessed: string;
  accessCount: number;
}

interface CustodyEvent {
  id: string;
  timestamp: string;
  action: 'upload' | 'access' | 'transfer' | 'analysis' | 'download' | 'delete';
  user: string;
  location?: string;
  notes?: string;
  hash: string;
}

interface FaceDetection {
  id: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  landmarks?: { [key: string]: { x: number; y: number } };
  embedding?: number[];
}

interface ObjectDetection {
  id: string;
  label: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

interface VideoMetadata {
  duration: number;
  resolution: string;
  frameRate: number;
  codec: string;
  scenes?: SceneDetection[];
}

interface SceneDetection {
  timestamp: number;
  description: string;
  confidence: number;
}

interface DigitalSignature {
  id: string;
  signer: string;
  certificate: string;
  timestamp: string;
  verified: boolean;
}

interface EvidenceCorrelation {
  id: string;
  relatedEvidenceId: string;
  correlationType: 'content' | 'metadata' | 'temporal' | 'entity' | 'semantic';
  confidence: number;
  description: string;
  detectedAt: string;
}

const EnhancedEvidenceLocker: React.FC = () => {
  const [evidence, setEvidence] = useState<EvidenceMetadata[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('files');
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({});


  useEffect(() => {
    loadEvidence();
  }, []);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      // Mock enhanced evidence data - replace with actual API calls
      const mockEvidence: EvidenceMetadata[] = [
        {
          id: 'ev-001',
          filename: 'bank_statement.pdf',
          fileType: 'pdf',
          size: 2457600,
          hash: 'a1b2c3d4e5f6...',
          uploadedAt: '2025-12-15T10:30:00Z',
          uploadedBy: 'investigator@example.com',
          caseId: 'CASE-2025-001',
          chainOfCustody: [
            {
              id: 'cust-001',
              timestamp: '2025-12-15T10:30:00Z',
              action: 'upload',
              user: 'investigator@example.com',
              notes: 'Initial evidence upload',
              hash: 'a1b2c3d4e5f6...'
            },
            {
              id: 'cust-002',
              timestamp: '2025-12-15T14:20:00Z',
              action: 'analysis',
              user: 'analyst@example.com',
              notes: 'OCR processing completed',
              hash: 'a1b2c3d4e5f6...'
            }
          ],
          multimodalData: {
            ocr: 'BANK STATEMENT\nAccount: ****1234\nBalance: $45,230.67\nRecent transactions...',
            signatures: [
              {
                id: 'sig-001',
                signer: 'John Doe',
                certificate: 'CN=John Doe,O=Bank,C=US',
                timestamp: '2025-12-15T10:30:00Z',
                verified: true
              }
            ]
          },
          correlations: [
            {
              id: 'corr-001',
              relatedEvidenceId: 'ev-002',
              correlationType: 'content',
              confidence: 0.89,
              description: 'Shared account number with wire transfer document',
              detectedAt: '2025-12-15T14:25:00Z'
            }
          ],
          integrityVerified: true,
          lastAccessed: '2025-12-15T16:45:00Z',
          accessCount: 12
        },
        {
          id: 'ev-002',
          filename: 'wire_transfer_receipt.jpg',
          fileType: 'image',
          size: 1843200,
          hash: 'f6e5d4c3b2a1...',
          uploadedAt: '2025-12-15T11:15:00Z',
          uploadedBy: 'investigator@example.com',
          caseId: 'CASE-2025-001',
          chainOfCustody: [
            {
              id: 'cust-003',
              timestamp: '2025-12-15T11:15:00Z',
              action: 'upload',
              user: 'investigator@example.com',
              notes: 'Wire transfer receipt upload',
              hash: 'f6e5d4c3b2a1...'
            }
          ],
          multimodalData: {
            ocr: 'WIRE TRANSFER RECEIPT\nAmount: $25,000.00\nFrom: Account ****1234\nTo: External Account',
            objects: [
              {
                id: 'obj-001',
                label: 'document',
                confidence: 0.95,
                boundingBox: { x: 50, y: 50, width: 400, height: 300 }
              },
              {
                id: 'obj-002',
                label: 'signature',
                confidence: 0.87,
                boundingBox: { x: 150, y: 280, width: 100, height: 40 }
              }
            ],
            faces: [
              {
                id: 'face-001',
                confidence: 0.92,
                boundingBox: { x: 200, y: 100, width: 80, height: 80 },
                landmarks: {
                  left_eye: { x: 220, y: 120 },
                  right_eye: { x: 250, y: 120 },
                  nose: { x: 235, y: 135 },
                  mouth: { x: 235, y: 150 }
                }
              }
            ],
            exif: {
              camera: 'iPhone 13 Pro',
              timestamp: '2025-12-15T11:10:00Z',
              location: '40.7128,-74.0060'
            }
          },
          correlations: [
            {
              id: 'corr-002',
              relatedEvidenceId: 'ev-001',
              correlationType: 'content',
              confidence: 0.89,
              description: 'Matching account number with bank statement',
              detectedAt: '2025-12-15T14:25:00Z'
            }
          ],
          integrityVerified: true,
          lastAccessed: '2025-12-15T15:30:00Z',
          accessCount: 8
        },
        {
          id: 'ev-003',
          filename: 'security_footage.mp4',
          fileType: 'video',
          size: 157286400,
          hash: '9h8g7f6e5d4...',
          uploadedAt: '2025-12-15T12:00:00Z',
          uploadedBy: 'security@example.com',
          caseId: 'CASE-2025-001',
          chainOfCustody: [
            {
              id: 'cust-004',
              timestamp: '2025-12-15T12:00:00Z',
              action: 'upload',
              user: 'security@example.com',
              notes: 'ATM security footage',
              hash: '9h8g7f6e5d4...'
            }
          ],
          multimodalData: {
            videoMetadata: {
              duration: 300,
              resolution: '1920x1080',
              frameRate: 30,
              codec: 'H.264',
              scenes: [
                {
                  timestamp: 45,
                  description: 'Person approaching ATM',
                  confidence: 0.85
                },
                {
                  timestamp: 120,
                  description: 'Transaction in progress',
                  confidence: 0.92
                }
              ]
            },
            faces: [
              {
                id: 'face-002',
                confidence: 0.88,
                boundingBox: { x: 800, y: 400, width: 120, height: 120 }
              }
            ]
          },
          correlations: [
            {
              id: 'corr-003',
              relatedEvidenceId: 'ev-002',
              correlationType: 'temporal',
              confidence: 0.76,
              description: 'Timestamp matches wire transfer time',
              detectedAt: '2025-12-15T15:00:00Z'
            }
          ],
          integrityVerified: true,
          lastAccessed: '2025-12-15T14:15:00Z',
          accessCount: 15
        }
      ];

      setEvidence(mockEvidence);
    } catch (error) {
      console.error('Failed to load evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'image': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <AudioWaveform className="h-5 w-5" />;
      case 'database': return <Database className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return 'text-red-500';
      case 'image': return 'text-green-500';
      case 'video': return 'text-blue-500';
      case 'audio': return 'text-purple-500';
      case 'database': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const processEvidence = async (evidenceId: string, processingType: string) => {
    setProcessingStatus(prev => ({ ...prev, [evidenceId]: 'processing' }));

    try {
      // Mock processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update evidence with processed data
      setEvidence(prev => prev.map(ev =>
        ev.id === evidenceId
          ? { ...ev, multimodalData: { ...ev.multimodalData, [processingType]: 'processed' } }
          : ev
      ));

      setProcessingStatus(prev => ({ ...prev, [evidenceId]: 'completed' }));
    } catch (error) {
      setProcessingStatus(prev => ({ ...prev, [evidenceId]: 'failed' }));
    }
  };

  const filteredEvidence = evidence.filter(ev => {
    const matchesSearch = ev.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ev.hash.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || ev.fileType === filterType;
    return matchesSearch && matchesType;
  });

  const fileTypes = ['all', ...Array.from(new Set(evidence.map(ev => ev.fileType)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Evidence Locker</h1>
          <p className="text-gray-600 mt-2">Advanced multimodal evidence processing and chain of custody tracking</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Evidence
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search evidence by filename, hash, or content..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fileTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="files">Evidence Files ({evidence.length})</TabsTrigger>
          <TabsTrigger value="analysis">Multimodal Analysis</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="custody">Chain of Custody</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvidence.map((ev) => (
              <Card
                key={ev.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedEvidence?.id === ev.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedEvidence(ev)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={getFileTypeColor(ev.fileType)}>
                        {getFileIcon(ev.fileType)}
                      </span>
                      <CardTitle className="text-lg truncate">{ev.filename}</CardTitle>
                    </div>
                    {ev.integrityVerified && (
                      <Shield className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <CardDescription className="flex items-center space-x-4 text-sm">
                    <span>{formatFileSize(ev.size)}</span>
                    <span className="font-mono text-xs">{ev.hash.slice(0, 8)}...</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uploaded:</span>
                      <span>{new Date(ev.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Accessed:</span>
                      <span>{new Date(ev.lastAccessed).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Access Count:</span>
                      <span>{ev.accessCount}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ev.multimodalData?.ocr && <Badge variant="secondary">OCR</Badge>}
                      {ev.multimodalData?.faces && <Badge variant="secondary">Faces</Badge>}
                      {ev.multimodalData?.objects && <Badge variant="secondary">Objects</Badge>}
                      {ev.multimodalData?.videoMetadata && <Badge variant="secondary">Video</Badge>}
                      {ev.multimodalData?.audioTranscript && <Badge variant="secondary">Audio</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {selectedEvidence ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Multimodal Analysis: {selectedEvidence.filename}
                  </CardTitle>
                  <CardDescription>
                    AI-powered content analysis and feature extraction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => processEvidence(selectedEvidence.id, 'ocr')}
                      disabled={processingStatus[selectedEvidence.id] === 'processing'}
                      className="justify-start"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {processingStatus[selectedEvidence.id] === 'processing' ? 'Processing OCR...' : 'Extract Text (OCR)'}
                    </Button>
                    <Button
                      onClick={() => processEvidence(selectedEvidence.id, 'faces')}
                      disabled={processingStatus[selectedEvidence.id] === 'processing'}
                      className="justify-start"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {processingStatus[selectedEvidence.id] === 'processing' ? 'Detecting Faces...' : 'Face Detection'}
                    </Button>
                    <Button
                      onClick={() => processEvidence(selectedEvidence.id, 'objects')}
                      disabled={processingStatus[selectedEvidence.id] === 'processing'}
                      className="justify-start"
                    >
                      <User className="h-4 w-4 mr-2" />
                      {processingStatus[selectedEvidence.id] === 'processing' ? 'Detecting Objects...' : 'Object Detection'}
                    </Button>
                    <Button
                      onClick={() => processEvidence(selectedEvidence.id, 'metadata')}
                      disabled={processingStatus[selectedEvidence.id] === 'processing'}
                      className="justify-start"
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      {processingStatus[selectedEvidence.id] === 'processing' ? 'Extracting Metadata...' : 'Extract Metadata'}
                    </Button>
                  </div>

                  {processingStatus[selectedEvidence.id] && (
                    <Alert className={
                      processingStatus[selectedEvidence.id] === 'completed'
                        ? 'border-green-200 bg-green-50'
                        : processingStatus[selectedEvidence.id] === 'failed'
                        ? 'border-red-200 bg-red-50'
                        : 'border-blue-200 bg-blue-50'
                    }>
                      {processingStatus[selectedEvidence.id] === 'completed' && <CheckCircle className="h-4 w-4" />}
                      {processingStatus[selectedEvidence.id] === 'processing' && <Clock className="h-4 w-4" />}
                      {processingStatus[selectedEvidence.id] === 'failed' && <AlertTriangle className="h-4 w-4" />}
                      <AlertTitle>
                        {processingStatus[selectedEvidence.id] === 'completed' && 'Processing Complete'}
                        {processingStatus[selectedEvidence.id] === 'processing' && 'Processing...'}
                        {processingStatus[selectedEvidence.id] === 'failed' && 'Processing Failed'}
                      </AlertTitle>
                      <AlertDescription>
                        {processingStatus[selectedEvidence.id] === 'completed' && 'Multimodal analysis completed successfully.'}
                        {processingStatus[selectedEvidence.id] === 'processing' && 'Please wait while we analyze the evidence.'}
                        {processingStatus[selectedEvidence.id] === 'failed' && 'Analysis failed. Please try again.'}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Analysis Results */}
              {selectedEvidence.multimodalData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedEvidence.multimodalData.ocr && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">OCR Text</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-50 p-3 rounded text-sm font-mono max-h-48 overflow-y-auto">
                          {selectedEvidence.multimodalData.ocr}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedEvidence.multimodalData.faces && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Face Detection</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedEvidence.multimodalData.faces.map((face, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Face {index + 1}</span>
                              <Badge variant="secondary">
                                {(face.confidence * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedEvidence.multimodalData.objects && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Object Detection</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedEvidence.multimodalData.objects.map((obj, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm capitalize">{obj.label}</span>
                              <Badge variant="secondary">
                                {(obj.confidence * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedEvidence.multimodalData.exif && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">EXIF Metadata</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 text-sm">
                          {Object.entries(selectedEvidence.multimodalData.exif).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Evidence for Analysis</h3>
              <p className="text-gray-600">Choose an evidence file from the Files tab to perform multimodal analysis</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="correlations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="h-5 w-5 mr-2" />
                Evidence Correlation Engine
              </CardTitle>
              <CardDescription>
                AI-powered analysis of relationships between evidence files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedEvidence?.correlations.map((correlation) => (
                  <div key={correlation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="capitalize">
                          {correlation.correlationType}
                        </Badge>
                        <Badge className={
                          correlation.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                          correlation.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {(correlation.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(correlation.detectedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{correlation.description}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Related to:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {correlation.relatedEvidenceId}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custody" className="space-y-6">
          {selectedEvidence ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Chain of Custody: {selectedEvidence.filename}
                </CardTitle>
                <CardDescription>
                  Complete audit trail of evidence handling and access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedEvidence.chainOfCustody.map((event) => (
                    <div key={event.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {event.action}
                          </Badge>
                          <span className="text-sm text-gray-600">{event.user}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="text-sm text-gray-700 mb-2">{event.notes}</p>
                      )}
                      <div className="text-xs text-gray-500 font-mono">
                        Hash: {event.hash.slice(0, 16)}...
                      </div>
                      {event.location && (
                        <div className="text-xs text-gray-500 mt-1">
                          Location: {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Integrity Status</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={
                      selectedEvidence.integrityVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }>
                      {selectedEvidence.integrityVerified ? 'Verified' : 'Compromised'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Last verified: {new Date(selectedEvidence.lastAccessed).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Evidence for Custody Review</h3>
              <p className="text-gray-600">Choose an evidence file from the Files tab to view its chain of custody</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedEvidenceLocker;