import React, { useState, useMemo } from "react";
import { usePersistedState } from "@/hooks/usePersistedState";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText,
  Search,
  Type,
  AlertCircle,
  Copy,
  CheckCircle,
} from "lucide-react";

// Worker configuration (Critical for Vite)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// OCR bounding box type
export interface OCRRegion {
  id: string;
  text: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  type: "amount" | "date" | "entity" | "text";
}

// Mock OCR data - would come from backend in production
const MOCK_OCR_REGIONS: OCRRegion[] = [
  {
    id: "1",
    text: "$45,000.00",
    confidence: 0.98,
    bbox: { x: 120, y: 85, width: 100, height: 24 },
    type: "amount",
  },
  {
    id: "2",
    text: "John Doe",
    confidence: 0.95,
    bbox: { x: 50, y: 140, width: 80, height: 20 },
    type: "entity",
  },
  {
    id: "3",
    text: "2024-12-01",
    confidence: 0.99,
    bbox: { x: 200, y: 140, width: 90, height: 20 },
    type: "date",
  },
  {
    id: "4",
    text: "Wire Transfer",
    confidence: 0.92,
    bbox: { x: 50, y: 200, width: 100, height: 18 },
    type: "text",
  },
  {
    id: "5",
    text: "Acme Corp LLC",
    confidence: 0.88,
    bbox: { x: 50, y: 250, width: 110, height: 20 },
    type: "entity",
  },
  {
    id: "6",
    text: "$12,500.00",
    confidence: 0.97,
    bbox: { x: 200, y: 250, width: 90, height: 22 },
    type: "amount",
  },
];

interface EvidenceViewerProps {
  fileUrl: string | null;
  ocrData?: OCRRegion[];
  initialRegionId?: string;
}

const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  fileUrl,
  ocrData,
  initialRegionId,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1); // Page number usually resets per document
  const [scale, setScale] = usePersistedState<number>(
    "evidence_viewer_scale",
    1.0,
  );
  const [showOCR, setShowOCR] = usePersistedState<boolean>(
    "evidence_viewer_show_ocr",
    !!initialRegionId,
  );
  const [selectedRegion, setSelectedRegion] = useState<OCRRegion | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = usePersistedState<string>(
    "evidence_viewer_ocr_filter",
    "all",
  );

  // Use provided OCR data or fall back to mock
  const regions = ocrData || MOCK_OCR_REGIONS;

  // Set initial region if provided
  React.useEffect(() => {
    if (initialRegionId) {
      const region = regions.find((r) => r.id === initialRegionId);
      if (region) {
        setSelectedRegion(region);
        setShowOCR(true);
      }
    }
  }, [initialRegionId, regions, setShowOCR]);

  // Filter regions by type
  const filteredRegions = useMemo(() => {
    if (filterType === "all") return regions;
    return regions.filter((r) => r.type === filterType);
  }, [regions, filterType]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "amount":
        return {
          border: "border-green-400",
          bg: "bg-green-400/20",
          text: "text-green-400",
        };
      case "date":
        return {
          border: "border-blue-400",
          bg: "bg-blue-400/20",
          text: "text-blue-400",
        };
      case "entity":
        return {
          border: "border-purple-400",
          bg: "bg-purple-400/20",
          text: "text-purple-400",
        };
      default:
        return {
          border: "border-yellow-400",
          bg: "bg-yellow-400/20",
          text: "text-yellow-400",
        };
    }
  };

  const copyText = (region: OCRRegion) => {
    navigator.clipboard.writeText(region.text);
    setCopiedId(region.id);
  };

  // Cleanup copied state timeout
  React.useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  if (!fileUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border-dashed border-2 border-slate-200 dark:border-slate-800">
        <FileText size={48} className="mb-4 opacity-50" />
        <p>No document selected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Toolbar */}
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex justify-between items-center px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-200 disabled:opacity-50"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-slate-300 font-mono">
            Page {pageNumber} of {numPages || "--"}
          </span>
          <button
            onClick={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))}
            disabled={pageNumber >= (numPages || 1)}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-200 disabled:opacity-50"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-[1px] bg-slate-700 mx-2"></div>
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-200"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-xs text-slate-400 w-12 text-center">
            {(scale * 100).toFixed(0)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-200"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {showOCR && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-700 text-slate-200 text-xs rounded px-2 py-1 border-none"
              aria-label="Filter OCR results by type"
            >
              <option value="all">All Types</option>
              <option value="amount">Amounts</option>
              <option value="date">Dates</option>
              <option value="entity">Entities</option>
              <option value="text">Text</option>
            </select>
          )}
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              showOCR
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
            onClick={() => setShowOCR(!showOCR)}
          >
            <Type size={14} />
            OCR ({regions.length})
          </button>
          <button
            className="p-1.5 hover:bg-slate-700 rounded text-slate-200"
            aria-label="Search document"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Document Canvas */}
      <div className="flex-1 overflow-auto bg-slate-950 flex justify-center p-8 relative">
        <div className="relative shadow-xl">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center gap-2 text-white/50">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Loading PDF...
              </div>
            }
            error={
              <div className="text-red-400 flex items-center gap-2 p-4 bg-red-900/20 rounded">
                <AlertCircle size={18} />
                Failed to load document
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="border border-white/10"
            />
          </Document>

          {/* OCR Overlay Regions */}
          {showOCR &&
            filteredRegions.map((region) => {
              const colors = getTypeColor(region.type);
              const isSelected = selectedRegion?.id === region.id;

              return (
                <div
                  key={region.id}
                  className={`absolute border-2 ${colors.border} ${colors.bg} cursor-pointer transition-all
                  ${isSelected ? "ring-2 ring-white shadow-lg z-20" : "hover:ring-1 hover:ring-white/50 z-10"}`}
                  style={{
                    left: region.bbox.x * scale,
                    top: region.bbox.y * scale,
                    width: region.bbox.width * scale,
                    height: region.bbox.height * scale,
                  }}
                  onClick={() => setSelectedRegion(isSelected ? null : region)}
                  role="button"
                  aria-label={`OCR region: ${region.text}`}
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    setSelectedRegion(isSelected ? null : region)
                  }
                >
                  {/* Confidence tooltip */}
                  <div
                    className={`absolute -top-7 left-0 ${colors.bg} ${colors.text} text-xs font-bold px-2 py-0.5 rounded 
                  opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none
                  ${isSelected ? "opacity-100" : ""}`}
                  >
                    {(region.confidence * 100).toFixed(0)}% | {region.type}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Selected Region Details Panel */}
      {showOCR && selectedRegion && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-800/95 backdrop-blur rounded-xl p-4 shadow-2xl border border-slate-700 z-30">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${getTypeColor(selectedRegion.type).bg} ${getTypeColor(selectedRegion.type).text}`}
                >
                  {selectedRegion.type.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400">
                  Confidence: {(selectedRegion.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-lg font-mono text-white">
                {selectedRegion.text}
              </p>
            </div>
            <button
              onClick={() => copyText(selectedRegion)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
              aria-label="Copy text"
            >
              {copiedId === selectedRegion.id ? (
                <>
                  <CheckCircle size={14} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* OCR Summary Bar */}
      {showOCR && (
        <div className="h-8 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-4 text-xs text-slate-400">
          <span>
            {filteredRegions.length} regions detected
            {filterType !== "all" && ` (filtered: ${filterType})`}
          </span>
          <span>
            Avg confidence:{" "}
            {(
              (filteredRegions.reduce((sum, r) => sum + r.confidence, 0) /
                filteredRegions.length) *
              100
            ).toFixed(1)}
            %
          </span>
        </div>
      )}
    </div>
  );
};

export default EvidenceViewer;
