const InvestigationSkeleton = () => {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="w-72 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-4">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-transparent"
            >
              <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas Area Skeleton */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Toolbar Skeleton */}
        <div className="h-16 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4">
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
          <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>

        {/* Canvas Space */}
        <div className="flex-1 relative bg-slate-50 dark:bg-slate-950 p-8 flex items-center justify-center">
          {/* Fake Nodes */}
          <div className="absolute top-1/3 left-1/4 w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>

          <div className="text-slate-400 text-sm font-medium animate-pulse">
            Loading Graph Data...
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigationSkeleton;
