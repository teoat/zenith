import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import {
  Pointer,
  File,
  CheckCircle,
  Download,
  History,
  AlertTriangle,
} from "lucide-react";
import { EvidenceMetadata } from "@/types/evidence";

interface EvidenceDetailsSidebarProps {
  selectedEvidence: EvidenceMetadata | null;
}

export const EvidenceDetailsSidebar: React.FC<EvidenceDetailsSidebarProps> = ({
  selectedEvidence,
}) => {
  if (!selectedEvidence) {
    return (
      <Card className="h-full border-dashed flex items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <Pointer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Select an item to view secure metadata and blockchain verification
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4 overflow-hidden border-blue-500/20 shadow-xl">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
        <CardTitle className="text-lg flex items-center">
          <File className="h-5 w-5 mr-2 text-blue-500" />
          Evidence Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-tighter">
            Filename
          </p>
          <p className="font-mono text-sm break-all font-semibold">
            {selectedEvidence.filename}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-tighter">
              Type
            </p>
            <Badge
              variant="outline"
              className="uppercase bg-blue-50 text-blue-600 border-blue-200"
            >
              {selectedEvidence.fileType}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-tighter">
              Size
            </p>
            <p className="text-sm font-semibold">
              {(selectedEvidence.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-tighter">
            SHA-256 Hash
          </p>
          <code className="text-[10px] bg-slate-100 dark:bg-slate-800 p-2 rounded block break-all font-mono opacity-80">
            {selectedEvidence.hash}
          </code>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-tighter">
            Integrity Status
          </p>
          <div className="flex items-center text-green-600 bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded-lg border border-green-200/50">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="text-sm font-bold">Verified & Immutable</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2 pt-2">
          <Button
            className="w-full justify-start hover:translate-x-1 transition-transform"
            variant="secondary"
          >
            <Download className="h-4 w-4 mr-2 text-blue-500" />
            Secure Download
          </Button>
          <Button
            className="w-full justify-start hover:translate-x-1 transition-transform"
            variant="secondary"
          >
            <History className="h-4 w-4 mr-2 text-blue-500" />
            Full Access History
          </Button>
          <Button
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            variant="ghost"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Integrity Issue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
