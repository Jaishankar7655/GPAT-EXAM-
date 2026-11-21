import React from 'react';

export default function LoadingSkeleton({ lines = 4 }) {
  return (
    <div className="animate-pulse space-y-3 py-6">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-200 dark:bg-slate-800 rounded"
            style={{ width: `${85 - (i % 3) * 15}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

