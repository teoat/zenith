import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { secureLogger } from '../utils/secureLogger';
import {
  FileText,
  Search,
  Shield,
  CheckCircle,
  Network,
  Zap,
  Filter,
  History,
  Database,
  Lock,
  Clock,
  Hash,
  File,
  Pointer,
  Download,
  AlertTriangle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';

import {
  EvidenceMetadata
} from '../types/evidence';
import { EvidenceStats } from '../components/evidence/EvidenceStats';
import { EvidenceDetailsSidebar } from '../components/evidence/EvidenceDetailsSidebar';
import { EvidenceSearchFilters } from '../components/evidence/EvidenceSearchFilters';
import { MOCK_EVIDENCE } from '../mocks/evidenceMocks';
import { EvidenceCard } from '../components/evidence/EvidenceCard';
import { ChainOfCustodyTimeline } from '../components/evidence/ChainOfCustodyTimeline';
import { EvidenceCorrelationsList } from '../components/evidence/EvidenceCorrelationsList';
import { MultimodalAnalysisResults } from '../components/evidence/MultimodalAnalysisResults';
import VirtualizedEvidenceList from '@/components/VirtualizedEvidenceList';

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
      setEvidence(MOCK_EVIDENCE);
    } catch (error) {
      secureLogger.error('Failed to load evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  // Utility functions now imported from shared utils

  const startProcessing = async (id: string) => {
    setProcessingStatus(prev => ({ ...prev, [id]: 'processing' }));

    // Simulate multimodal analysis
    setTimeout(() => {
      setProcessingStatus(prev => ({ ...prev, [id]: 'completed' }));
    }, 3000);
  };

  const filteredEvidence = evidence.filter(ev => {
    const matchesSearch = ev.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ev.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || ev.fileType === filterType;
    return matchesSearch && matchesFilter;
  });

  const fileTypes = ['all', ...Array.from(new Set(evidence.map(ev => ev.fileType)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading Evidence Repository...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Secure Storage</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center">
            Evidence Locker
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
            Enterprise-grade secure evidence management with multimodal AI analysis and blockchain-verified integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm">
            <History className="h-4 w-4 mr-2" />
            Audit Log
          </Button>
          <Button className="rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20">
            <FileText className="h-4 w-4 mr-2" />
            Chain of Custody
          </Button>
        </div>
      </div>

      {/* Statistics Row */}
      <EvidenceStats totalItems={evidence.length} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <TabsList className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
            <TabsTrigger value="files" className="rounded-lg px-6">
              Files
            </TabsTrigger>
            <TabsTrigger value="analysis" className="rounded-lg px-6">
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="correlations" className="rounded-lg px-6">
              Correlations
            </TabsTrigger>
            <TabsTrigger value="custody" className="rounded-lg px-6">
              Custody
            </TabsTrigger>
          </TabsList>

          {activeTab === 'files' && (
            <EvidenceSearchFilters 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
            />
          )}
        </div>

        <TabsContent value="files" className="mt-0 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Evidence List */}
            <div className="lg:col-span-3">
              {filteredEvidence.length > 0 ? (
                // Use virtualization for large lists; fallback to grid for smaller sets
                filteredEvidence.length > 18 ? (
                  <VirtualizedEvidenceList
                    items={filteredEvidence}
                    rowHeight={128}
                    height={Math.min(800, filteredEvidence.length * 128)}
                    renderItem={(ev) => (
                      <div className="p-2">
                        <EvidenceCard
                          key={ev.id}
                          evidence={ev}
                          isSelected={selectedEvidence?.id === ev.id}
                          onSelect={(selected) => setSelectedEvidence(selected)}
                        />
                      </div>
                    )}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEvidence.map((ev) => (
                      <EvidenceCard
                        key={ev.id}
                        evidence={ev}
                        isSelected={selectedEvidence?.id === ev.id}
                        onSelect={(selected) => setSelectedEvidence(selected)}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full w-fit mx-auto mb-4">
                    <FileText className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">No evidence found</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">Try adjusting your search query or filters to find specific items.</p>
                </div>
              )}
            </div>

            {/* Selection Sidebar */}
            <div className="lg:col-span-1">
              <EvidenceDetailsSidebar selectedEvidence={selectedEvidence} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {selectedEvidence ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                    Multimodal Analysis Engine: {selectedEvidence.filename}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Run our enterprise AI models to extract content, signatures, faces, and more.
                      </p>
                    </div>
                    <Button
                      onClick={() => startProcessing(selectedEvidence.id)}
                      disabled={processingStatus[selectedEvidence.id] === 'processing'}
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

              {selectedEvidence.multimodalData && (
                <MultimodalAnalysisResults evidence={selectedEvidence} />
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
          <EvidenceCorrelationsList evidence={selectedEvidence} />
        </TabsContent>

        <TabsContent value="custody" className="space-y-6">
          {selectedEvidence ? (
            <ChainOfCustodyTimeline evidence={selectedEvidence} />
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