import React, { Suspense } from 'react';
import EvidenceViewer from '../evidence/EvidenceViewer';
import { AccessibleModal } from '../ui/AccessibleModal';
import { EvidenceItem } from '../../lib/api';
import { API_BASE } from '../../services/client';

interface EvidenceSpotlightProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceId: string;
  regionId?: string;
  title?: string;
}

export const EvidenceSpotlight: React.FC<EvidenceSpotlightProps> = ({
  isOpen,
  onClose,
  evidenceId,
  regionId,
  title = "Evidence Spotlight"
}) => {
  // In a real app, we'd fetch the evidence metadata here
  // For now, we'll construct the URL and let the viewer handle it
  const fileUrl = `${API_BASE}/evidence/${evidenceId}/download`;

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
    >
      <div className="h-[600px] w-full">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-500">Loading viewer...</div>}>
          <EvidenceViewer 
            fileUrl={fileUrl} 
            initialRegionId={regionId}
            // ocrData={[...]} 
          />
        </Suspense>
      </div>
    </AccessibleModal>
  );
};
