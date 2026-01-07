import React, { useState, memo } from "react";
import { useEvidence } from "@/hooks/useEvidence";
import PageErrorBoundary from "@/components/PageErrorBoundary";
import ForensicsSkeleton from "./ForensicsSkeleton";
import ForensicsErrorState from "./ForensicsErrorState";
import ForensicsToolbar from "./ForensicsToolbar";
import EvidenceList from "./EvidenceList";
import EvidenceViewer from "./EvidenceViewer";
import { FileText, ShieldAlert, Activity, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EvidenceItem } from "@/types/api";

interface ForensicsLayoutProps {}

const MetricCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) => (
  <Card className="flex items-center p-4 gap-4 bg-slate-900 border-slate-800">
    <div className="p-2 bg-slate-800 rounded-lg">
      <Icon className="h-5 w-5 text-slate-400" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-bold text-slate-200">{value}</p>
    </div>
  </Card>
);

const ForensicsLayout: React.FC<ForensicsLayoutProps> = memo(() => {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: evidenceData,
    isLoading,
    error,
    refetch,
  } = useEvidence(
    undefined, // caseId
    currentPage,
    20, // pageSize
    searchQuery || undefined,
  );

  const selectedEvidence =
    evidenceData?.items.find(
      (item: EvidenceItem) => item.id === selectedEvidenceId,
    ) || null;

  if (isLoading) {
    return <ForensicsSkeleton />;
  }

  if (error) {
    return <ForensicsErrorState error={error} onRetry={refetch} />;
  }

  // Calculate generic stats based on loaded items for specific counts
  // In a real app these should come from the API summary endpoint
  const stats = {
    total: evidenceData?.total || 0,
     
    flagged:
      evidenceData?.items.filter(
        (i: any) => i.riskLevel === "high" || i.tags?.includes("flagged"),
      ).length || 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processed: evidenceData?.items.filter((i: any) => i.processed).length || 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pending: evidenceData?.items.filter((i: any) => !i.processed).length || 0,
  };

  return (
    <PageErrorBoundary>
      <div className="forensics-layout h-full flex flex-col bg-slate-950 text-slate-200">
        {/* Metrics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-slate-800 bg-slate-900/50">
          <MetricCard
            label="Total Evidence"
            value={stats.total}
            icon={FileText}
          />
          <MetricCard
            label="High Risk"
            value={stats.flagged}
            icon={ShieldAlert}
          />
          <MetricCard
            label="Processed"
            value={stats.processed}
            icon={Activity}
          />
          <MetricCard
            label="Pending Analysis"
            value={stats.pending}
            icon={Clock}
          />
        </div>

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

ForensicsLayout.displayName = "ForensicsLayout";

export default ForensicsLayout;
