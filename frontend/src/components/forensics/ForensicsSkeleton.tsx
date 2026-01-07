import React from "react";

const ForensicsSkeleton: React.FC = () => {
  return (
    <div className="forensics-layout h-full flex flex-col bg-slate-950 text-slate-200">
      <div className="animate-pulse">
        <div className="h-12 bg-slate-800 mb-4"></div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-slate-800 animate-pulse mr-4"></div>
        <div className="flex-1 bg-slate-800 animate-pulse"></div>
      </div>
    </div>
  );
};

export default ForensicsSkeleton;
