'use client';

import React from 'react';

export interface LoadingSkeletonProps {
  type: 'ring' | 'receipt' | 'timeline' | 'plan';
  className?: string;
}

export function LoadingSkeleton({ type, className = '' }: LoadingSkeletonProps) {
  if (type === 'ring') {
    return (
      <div
        role="status"
        aria-label="Loading air quality gauge..."
        className={`flex flex-col items-center justify-center p-6 space-y-4 animate-pulse motion-reduce:animate-none ${className}`}
      >
        <div className="w-40 h-40 rounded-full border-8 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center">
          <div className="w-16 h-8 bg-slate-300 dark:bg-slate-700 rounded mb-2" />
          <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded mt-2" />
        <div className="w-48 h-3 bg-slate-100 dark:bg-slate-900 rounded" />
      </div>
    );
  }

  if (type === 'receipt') {
    return (
      <div
        role="status"
        aria-label="Loading impact receipt..."
        className={`p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm animate-pulse motion-reduce:animate-none ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="w-2/3 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="w-1/3 h-3.5 bg-slate-100 dark:bg-slate-800/60 rounded" />

        {/* Breathe Row Skeleton */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-2">
          <div className="flex justify-between">
            <div className="w-28 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-16 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Give Row Skeleton */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-2">
          <div className="flex justify-between">
            <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-20 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Footer Pills & Action */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="w-24 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (type === 'timeline') {
    return (
      <div
        role="status"
        aria-label="Loading 24-hour timeline..."
        className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm animate-pulse motion-reduce:animate-none ${className}`}
      >
        <div className="flex justify-between items-center">
          <div className="w-36 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="w-24 h-4 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="flex gap-1.5 overflow-hidden py-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 min-w-[28px] h-20 bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col justify-end p-1"
            >
              <div
                className="w-full bg-slate-200 dark:bg-slate-700 rounded-sm"
                style={{ height: `${20 + (i % 5) * 12}px` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 'plan' type
  return (
    <div
      role="status"
      aria-label="Loading air protection plan..."
      className={`space-y-4 animate-pulse motion-reduce:animate-none ${className}`}
    >
      <div className="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-full h-24 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
      <div className="w-40 h-5 bg-slate-200 dark:bg-slate-800 rounded mt-4" />
      <div className="space-y-3">
        <div className="w-full h-44 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
        <div className="w-full h-44 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
      </div>
    </div>
  );
}

export default LoadingSkeleton;
