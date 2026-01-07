import React, { type ReactNode } from "react";

interface AdjudicationLayoutProps {
  list: ReactNode;
  detail: ReactNode;
  isDetailOpen: boolean;
}

const AdjudicationLayout: React.FC<AdjudicationLayoutProps> = ({
  list,
  detail,
  isDetailOpen,
}) => {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Left Pane (List) - Always visible on desktop, hidden on mobile if detail open */}
      <div
        className={`
        w-full md:w-[350px] lg:w-[400px] flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform
        ${isDetailOpen ? "hidden md:flex" : "flex"}
      `}
      >
        {list}
      </div>

      {/* Right Pane (Detail) - Hidden on desktop if nothing selected (placeholder?), visible on mobile only when selected */}
      <div
        className={`
        flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 transition-opacity
        ${isDetailOpen ? "flex" : "hidden md:flex opacity-50 pointer-events-none md:opacity-100 md:pointer-events-auto"}
      `}
      >
        {isDetailOpen ? (
          detail
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚡️</span>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Select an alert to review
            </h3>
            <p className="max-w-sm">
              Use arrow keys ↑ ↓ to navigate quickly. Press 'A' to approve or
              'R' to reject.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdjudicationLayout;
