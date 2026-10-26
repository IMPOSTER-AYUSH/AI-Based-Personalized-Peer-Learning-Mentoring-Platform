import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse space-y-4">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
    </div>
    <div className="flex space-x-2 pt-2">
      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
    </div>
  </div>
);

export const PageSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

export default CardSkeleton;
