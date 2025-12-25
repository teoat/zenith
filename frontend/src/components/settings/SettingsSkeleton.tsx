import React from 'react';

const SettingsSkeleton: React.FC = () => {
  return (
    <div className="settings-container max-w-4xl mx-auto p-6 space-y-6" data-testid="settings-skeleton">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>

      {/* Navigation skeleton */}
      <div className="flex space-x-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded w-24"></div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );
};

export default SettingsSkeleton;