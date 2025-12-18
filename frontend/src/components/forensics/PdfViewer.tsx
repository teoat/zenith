import React, { useState } from "react";
import {
  PdfLoader,
  PdfHighlighter,
  Highlight,
  Popup,
  AreaHighlight,
} from "react-pdf-highlighter-extended";
import { pdfjs } from 'react-pdf';
import "./PdfViewer.css";

// Ensure worker is loaded for PDF rendering
try {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
} catch (e) {
    console.error("Failed to set PDF worker", e);
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
  onHighlight?: (highlight: IHighlight) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url, onHighlight }) => {
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);

  const addHighlight = (highlight: Omit<IHighlight, 'id'>) => {
    console.log("Saving highlight", highlight);
    const newHighlight = { ...highlight, id: crypto.randomUUID() };
    setHighlights((prev) => [newHighlight, ...prev]);
    onHighlight?.(newHighlight);
  };

  const updateHighlight = (highlightId: string, position: Partial<IHighlight['position']>, content: Partial<IHighlight['content']>) => {
    console.log("Updating highlight", highlightId, position, content);
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
            }
          : h;
      })
    );
  };

  return (
    <div className="h-full w-full relative bg-slate-50 dark:bg-slate-900" style={{ height: "calc(100vh - 100px)" }}>
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
              // transformSelection unused
            ) => (
              <Popup
                onConfirm={(comment: { text: string; emoji: string }) => {
                  addHighlight({ content, position, comment });
                  hideTipAndSelection();
                }}
                onCancel={hideTipAndSelection}
                popupContent={<div className="p-2">Add Comment</div>}
              />
            )}
            highlightTransform={(
              highlight: any,
              index: number,
              setTip: (highlight: any, callback: (highlight: any) => React.ReactNode) => void,
              hideTip: () => void,
              viewportToScaled: (rect: any) => any,
              screenshot: (position: any) => string,
              isScrolledTo: boolean
            ) => {
              const isTextHighlight = !(
                highlight.content && highlight.content.image
              );

              const component = isTextHighlight ? (
                <Highlight
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
                <Popup
                  popupContent={<div className="p-2 bg-white text-black shadow rounded">{highlight.comment?.text}</div>}
                  onMouseOver={(_: any) =>
                    setTip(highlight, (_: any) => _) 
                  }
                  onMouseOut={hideTip}
                  key={index}
                >
                  {component}
                </Popup>
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
