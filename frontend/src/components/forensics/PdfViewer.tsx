import React, { useState, useEffect } from "react";
import {
  PdfLoader,
  PdfHighlighter,
  TextHighlight,
  MonitoredHighlightContainer,
  AreaHighlight,
} from "react-pdf-highlighter-extended";
import { pdfjs } from 'react-pdf';
import { api } from "../../lib/api";
import { secureLogger } from '../../utils/secureLogger';
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
  position: {
    boundingRect: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
    };
    rects: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
    }[];
    pageNumber: number;
  };
  content: {
    text?: string;
    image?: string;
  };
  comment: {
    text: string;
    emoji: string;
  };
}

interface PdfViewerProps {
  url: string;
  evidenceId?: string;
  onHighlight?: (highlight: IHighlight) => void;
}

const SimpleTip = ({ onConfirm, onCancel }: { onConfirm: (comment: { text: string; emoji: string }) => void, onCancel: () => void }) => {
  const [comment, setComment] = useState("");
  return (
      <div className="p-3 bg-white dark:bg-slate-800 shadow-2xl rounded-lg border border-slate-200 dark:border-slate-700 w-64 z-50 animate-fadeIn">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Add Forensic Note</h4>
          <textarea
              className="w-full h-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              placeholder="Observed discrepancy..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-2">
              <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
              <button 
                onClick={() => onConfirm({ text: comment, emoji: "🔍" })}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded shadow-sm transition-colors"
                disabled={!comment.trim()}
              >
                Save
              </button>
          </div>
      </div>
  );
};

const PdfViewer: React.FC<PdfViewerProps> = ({ url, evidenceId, onHighlight }) => {
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);

  useEffect(() => {
    const fetchHighlights = async () => {
        if (!evidenceId) return;
        try {
            setIsLoadingHighlights(true);
            const data = await api.getHighlights(evidenceId);
            setHighlights(data || []);
        } catch (err) {
            secureLogger.error('Failed to load highlights:', err);
        } finally {
            setIsLoadingHighlights(false);
        }
    };
    fetchHighlights();
  }, [evidenceId]);

  const addHighlight = async (highlight: Omit<IHighlight, 'id'>) => {
    const newHighlight = { ...highlight, id: crypto.randomUUID() };
    setHighlights((prev) => [newHighlight, ...prev]);
    
    if (evidenceId) {
        try {
            await api.saveHighlight(evidenceId, newHighlight);
        } catch (err) {
            secureLogger.error('Failed to persist highlight:', err);
        }
    }
    
    onHighlight?.(newHighlight);
  };

  const updateHighlight = (highlightId: string, position: Partial<IHighlight['position']>, content: Partial<IHighlight['content']>) => {
    setHighlights(
      highlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            } as IHighlight
          : h;
      })
    );
  };

  return (
    <div className="h-full w-full relative bg-slate-50 dark:bg-slate-900" style={{ height: "calc(100vh - 100px)" }}>
      {isLoadingHighlights && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <span className="text-xs text-slate-500 font-medium">Restoring forensic marks...</span>
              </div>
          </div>
      )}
      <PdfLoader url={url} beforeLoad={<div className="flex items-center justify-center h-full text-slate-500">Loading PDF...</div>}>
        {(pdfDocument: any) => (
          <PdfHighlighter
            pdfDocument={pdfDocument}
            enableAreaSelection={(event: any) => event.altKey}
            onScrollChange={() => {}}
            scrollRef={() => {}}
            onSelectionFinished={(
              position: any,
              content: any,
              hideTipAndSelection: () => void,
            ) => (
              <SimpleTip
                onConfirm={(comment: { text: string; emoji: string }) => {
                  addHighlight({ content, position, comment });
                  hideTipAndSelection();
                }}
                onCancel={hideTipAndSelection}
              />
            )}
            highlightTransform={(
              highlight: any,
              index: number,
              _setTip: any,
              _hideTip: any,
              viewportToScaled: (rect: any) => any,
              screenshot: (position: any) => string,
              isScrolledTo: boolean
            ) => {
              const isTextHighlight = !(
                highlight.content && highlight.content.image
              );

              const component = isTextHighlight ? (
                <TextHighlight
                  isScrolledTo={isScrolledTo}
                  position={highlight.position}
                  comment={highlight.comment}
                />
              ) : (
                <AreaHighlight
                  isScrolledTo={isScrolledTo}
                  highlight={highlight}
                  onChange={(boundingRect: any) => {
                    updateHighlight(
                      highlight.id,
                      { boundingRect: viewportToScaled(boundingRect) },
                      { image: screenshot(boundingRect) }
                    );
                  }}
                />
              );

              return (
                <MonitoredHighlightContainer
                  key={index}
                  highlightTip={{
                    position: "top",
                    content: (
                      <div className="p-2 bg-slate-800 text-white text-xs shadow-xl rounded border border-slate-700 max-w-xs animate-fadeIn">
                        {highlight.comment?.text}
                      </div>
                    )
                  }}
                >
                  {component}
                </MonitoredHighlightContainer>
              );
            }}
            highlights={highlights}
          />
        )}
      </PdfLoader>
    </div>
  );
};

export default PdfViewer;
