import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EvidenceMetadata } from "@/types/evidence";
import { formatPercentage } from "@/utils/formatters";

interface MultimodalAnalysisResultsProps {
  evidence: EvidenceMetadata;
}

export const MultimodalAnalysisResults: React.FC<
  MultimodalAnalysisResultsProps
> = ({ evidence }) => {
  if (!evidence.multimodalData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {evidence.multimodalData.ocr && (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 dark:text-white">
              OCR Text Extraction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-mono max-h-48 overflow-y-auto text-slate-700 dark:text-slate-300">
              {evidence.multimodalData.ocr}
            </div>
          </CardContent>
        </Card>
      )}

      {evidence.multimodalData.faces && (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 dark:text-white">
              Facial Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evidence.multimodalData.faces.map((face, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Face Profile {index + 1}
                  </span>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {formatPercentage(face.confidence, 1)} Confidence
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {evidence.multimodalData.objects && (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 dark:text-white">
              Object Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evidence.multimodalData.objects.map((obj, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700"
                >
                  <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                    {obj.label}
                  </span>
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                    {formatPercentage(obj.confidence, 1)} Accuracy
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {evidence.multimodalData.exif && (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 dark:text-white">
              Enhanced Metadata (EXIF)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {Object.entries(evidence.multimodalData.exif).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <span className="font-medium capitalize text-slate-600 dark:text-slate-400">
                      {key.replace("_", " ")}:
                    </span>
                    <span className="text-slate-900 dark:text-white font-mono">
                      {String(value)}
                    </span>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
