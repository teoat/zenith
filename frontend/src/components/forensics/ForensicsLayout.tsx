import React, { useState, memo } from 'react';
import { useEvidence } from '../../hooks/useEvidence';
import PageErrorBoundary from '../PageErrorBoundary';
import ForensicsSkeleton from './ForensicsSkeleton';
import ForensicsErrorState from './ForensicsErrorState';
import ForensicsToolbar from './ForensicsToolbar';
import EvidenceList from './EvidenceList';
import EvidenceViewer from './EvidenceViewer';

interface ForensicsLayoutProps {}

const ForensicsLayout: React.FC<ForensicsLayoutProps> = memo(() => {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: evidenceData, isLoading, error, refetch } = useEvidence(
    undefined, // caseId
    currentPage,
    20, // pageSize
    searchQuery || undefined
  );

  const selectedEvidence = evidenceData?.items.find(item => item.id === selectedEvidenceId) || null;

  if (isLoading) {
    return <ForensicsSkeleton />;
  }

  if (error) {
    return <ForensicsErrorState error={error} onRetry={refetch} />;
  }

  return (
    <PageErrorBoundary>
      <div className="forensics-layout h-full flex flex-col bg-slate-950 text-slate-200">
        <ForensicsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onPageChange={setCurrentPage}
          currentPage={currentPage}
          totalPages={Math.ceil((evidenceData?.total || 0) / 20)}
        />

        <div className="flex-1 flex overflow-hidden">
          <EvidenceList
            evidence={evidenceData?.items || []}
            selectedEvidenceId={selectedEvidenceId}
            onEvidenceSelect={setSelectedEvidenceId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <EvidenceViewer
            selectedEvidence={selectedEvidence}
            onEvidenceChange={setSelectedEvidenceId}
          />
        </div>
      </div>
    </PageErrorBoundary>
  );
});

ForensicsLayout.displayName = 'ForensicsLayout';

export default ForensicsLayout;