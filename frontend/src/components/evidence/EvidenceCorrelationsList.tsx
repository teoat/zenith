import React from "react";
import { Network } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EvidenceMetadata } from "@/types/evidence";
import { formatPercentage, formatDate } from "@/utils/formatters";

interface EvidenceCorrelationsListProps {
  evidence: EvidenceMetadata | null;
}

export const EvidenceCorrelationsList: React.FC<
  EvidenceCorrelationsListProps
> = ({ evidence }) => {
  if (!evidence) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <Network className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          No Correlations Found
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Select an evidence file to view its AI-detected relationships
        </p>
      </div>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-900 dark:text-white">
          <Network className="h-5 w-5 mr-2 text-purple-500" />
          Evidence Correlation Engine
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          AI-powered analysis of relationships between evidence files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {evidence.correlations.map((correlation) => (
            <div
              key={correlation.id}
              className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="capitalize border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  >
                    {correlation.correlationType}
                  </Badge>
                  <Badge
                    className={
                      correlation.confidence > 0.8
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : correlation.confidence > 0.6
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }
                  >
                    {formatPercentage(correlation.confidence, 0)} confidence
                  </Badge>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-500">
                  {formatDate(correlation.detectedAt)}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                {correlation.description}
              </p>
              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-500">
                <span className="font-medium">Related to:</span>
                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs text-blue-600 dark:text-blue-400">
                  {correlation.relatedEvidenceId}
                </code>
              </div>
            </div>
          ))}
          {evidence.correlations.length === 0 && (
            <div className="text-center py-6">
              <p className="text-slate-500 dark:text-slate-400">
                No correlations detected for this item.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
