import React from "react";
import { useParams } from "react-router-dom";

// Wrapper to extract caseId from route params for ProofVisualizationCard
const ProofVisualizationCardLazy = React.lazy(
  () => import("../features/dashboard/components/ProofVisualizationCard"),
);

const ProofVisualizationRoute: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  return <ProofVisualizationCardLazy caseId={caseId || "unknown"} />;
};

export default ProofVisualizationRoute;
