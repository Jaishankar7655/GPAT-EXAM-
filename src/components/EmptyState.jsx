import React from 'react';
import { FileQuestion } from 'lucide-react';

export default function EmptyState({
  title = 'No items found',
  description = 'You have not added any topics or records yet.',
  actionLabel,
  onAction,
  icon: Icon = FileQuestion
}) {
  return (
    <div className="text-center py-12 px-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 my-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded bg-[#1e4d3b] text-white hover:bg-[#163a2c] shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

