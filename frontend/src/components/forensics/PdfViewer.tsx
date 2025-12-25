import React, { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import { secureLogger } from '../../utils/secureLogger';
import { Button } from "@/components/ui/Button";
import { Save, X } from "lucide-react";
import "./PdfViewer.css";

// Ensure worker is loaded for PDF rendering
try {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
} catch (e) {
    secureLogger.error("Failed to set PDF worker", e);
}

// Interfaces
interface IHighlight {
  id: string;
  page: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: {
    text?: string;
    image?: string;
  };
  comment?: {
    text: string;
    emoji: string;
  };
}

interface PdfViewerProps {
  url: string;
  evidenceId?: string;
  onHighlight?: (highlight: IHighlight) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url, onHighlight }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  
  // Highlighting State
  const [highlights, setHighlights] = useState<IHighlight[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
  const [currentSelection, setCurrentSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [activePage, setActivePage] = useState<number | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handleMouseDown = (e: React.MouseEvent, pageNum: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setActivePage(pageNum);
    setCurrentSelection({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || activePage === null) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = Math.abs(currentX - selectionStart.x);
    const height = Math.abs(currentY - selectionStart.y);
    const x = Math.min(currentX, selectionStart.x);
    const y = Math.min(currentY, selectionStart.y);

    setCurrentSelection({ x, y, w: width, h: height });
  };

  const handleMouseUp = () => {
    if (isSelecting && currentSelection && currentSelection.w > 5 && currentSelection.h > 5) {
       // Valid selection made
    } else {
        // Click or tiny drag - cancel
        setCurrentSelection(null);
    }
    setIsSelecting(false);
  };

  const saveHighlight = () => {
      if (!currentSelection || activePage === null) return;
      
      const newHighlight: IHighlight = {
          id: `hl_${Date.now()}`,
          page: activePage,
          position: {
              x: currentSelection.x,
              y: currentSelection.y,
              width: currentSelection.w,
              height: currentSelection.h
          }
      };

      setHighlights([...highlights, newHighlight]);
      setCurrentSelection(null);
      if (onHighlight) onHighlight(newHighlight);
      secureLogger.info("Highlight created", { highlightId: newHighlight.id });
  };

  const cancelSelection = () => {
      setCurrentSelection(null);
      setActivePage(null);
  };

  return (
    <div className="h-full w-full relative bg-slate-50 dark:bg-slate-900 h-[calc(100vh-100px)] overflow-auto p-4 flex flex-col items-center" ref={containerRef}>
      <div className="mb-4 flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
         <span className="text-sm text-slate-500 font-medium">Tools:</span>
         <div className="flex gap-2 text-xs">
             <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Area Select</span>
         </div>
         <div className="h-4 w-px bg-slate-200 mx-2"/>
         <span className="text-xs text-slate-400">Click and drag to highlight evidence</span>
      </div>

      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        className="pdf-document"
        loading={<div className="flex items-center justify-center p-10 text-slate-500">Loading PDF...</div>}
        error={<div className="text-red-500 p-4">Failed to load PDF. Please verify the file integrity.</div>}
      >
        {Array.from(new Array(numPages), (_el, index) => {
          const pageNum = index + 1;
          return (
          <div key={`page_${pageNum}`} className="mb-8 shadow-lg relative group">
            {/* Page Wrapper for Event Handling */}
            <div 
                className="relative cursor-crosshair"
                onMouseDown={(e) => handleMouseDown(e, pageNum)}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{touchAction: 'none'}} // Prevent scrolling while dragging on touch
            >
                <Page 
                  pageNumber={pageNum} 
                  width={800 * scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
                
                {/* Render Existing Highlights */}
                {highlights.filter(h => h.page === pageNum).map(highlight => (
                    <div
                        key={highlight.id}
                        className="absolute border-2 border-yellow-400 bg-yellow-200/30 transition-all hover:bg-yellow-200/50"
                        style={{
                            left: highlight.position.x,
                            top: highlight.position.y,
                            width: highlight.position.width,
                            height: highlight.position.height,
                        }}
                        title="Evidence Highlight"
                    />
                ))}

                {/* Render Current Selection */}
                {activePage === pageNum && currentSelection && (
                    <>
                        <div
                            className="absolute border-2 border-blue-500 bg-blue-200/20 z-10"
                            style={{
                                left: currentSelection.x,
                                top: currentSelection.y,
                                width: currentSelection.w,
                                height: currentSelection.h,
                            }}
                        />
                        {/* Action Toolbar for Selection */}
                        {!isSelecting && (
                             <div 
                                className="absolute z-20 flex gap-1 bg-slate-900 text-white p-1 rounded-md shadow-xl animate-in fade-in zoom-in duration-200"
                                style={{
                                    left: currentSelection.x + currentSelection.w - 80, // Position near bottom right of selection
                                    top: currentSelection.y + currentSelection.h + 8
                                }}
                             >
                                <button onClick={saveHighlight} className="p-1 hover:bg-slate-700 rounded text-green-400">
                                    <Save size={16} />
                                </button>
                                <button onClick={cancelSelection} className="p-1 hover:bg-slate-700 rounded text-red-400">
                                    <X size={16} />
                                </button>
                             </div>
                        )}
                    </>
                )}
            </div>
          </div>
        )})}
      </Document>
    </div>
  );
};

export default PdfViewer;
