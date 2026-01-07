import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Upload, Eye } from 'lucide-react';
import { secureLogger } from '../../../utils/secureLogger';
import { secureRandom } from '../../../utils/secureRandom';
import { getFileIcon } from '../../../utils/fileUtils';
import { formatFileSize } from '../../../utils/formatters';

const MultimodalAnalyzer: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) return;

    setIsAnalyzing(true);
    try {
      // Mock analysis results
      const results = uploadedFiles.map((file, index) => ({
        id: `analysis_${index}`,
        filename: file.name,
        type: file.type,
        size: file.size,
        analysis: {
          ocr: file.type.includes('image') ? 'Text extracted successfully' : 'N/A',
          forensics: 'Digital signature validated',
          metadata: 'EXIF data extracted',
          classification: 'Document - Financial Record',
          risk_score: secureRandom.random() * 100,
          findings: [
            'Valid digital signature detected',
            'No tampering evidence found',
            'Metadata matches expected format'
          ]
        }
      }));

      setAnalysisResults(results);
    } catch (error) {
      secureLogger.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Using shared utility from utils/fileUtils.tsx

  const getRiskColor = (score: number) => {
    if (score > 70) return 'text-red-500 bg-red-500/10';
    if (score > 40) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-green-500 bg-green-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Multimodal File Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-medium text-white mb-2">
                Upload Files for Analysis
              </h3>
              <p className="text-slate-400 mb-4">
                Support for images, documents, and multimedia files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
              >
                Choose Files
              </Button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-300">Uploaded Files:</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-700 rounded">
                    {getFileIcon(file.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{file.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                ))}

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Files'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
          {analysisResults.map((result) => (
            <Card key={result.id} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    {getFileIcon(result.type)}
                    {result.filename}
                  </CardTitle>
                  <Badge className={`${getRiskColor(result.analysis.risk_score)} border-0`}>
                    Risk: {Math.round(result.analysis.risk_score)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Analysis Results</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">OCR:</span>
                        <span className="text-white">{result.analysis.ocr}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Forensics:</span>
                        <span className="text-white">{result.analysis.forensics}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Metadata:</span>
                        <span className="text-white">{result.analysis.metadata}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Classification:</span>
                        <span className="text-white">{result.analysis.classification}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Key Findings</h4>
                    <ul className="space-y-1">
                      {result.analysis.findings.map((finding: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Eye className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                          <span className="text-slate-300">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary">
                    View Detailed Report
                  </Button>
                  <Button size="sm" variant="outline">
                    Download Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {analysisResults.length === 0 && !isAnalyzing && (
        <div className="text-center py-12">
          <Upload className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            Multimodal Analysis Ready
          </h3>
          <p className="text-slate-500">
            Upload files to perform comprehensive analysis including OCR, forensics, and metadata extraction
          </p>
        </div>
      )}
    </div>
  );
};

export default MultimodalAnalyzer;