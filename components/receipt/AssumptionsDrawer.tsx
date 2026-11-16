'use client';

import React, { useState } from 'react';
import { ReceiptAssumption } from '@/lib/schemas';

export interface AssumptionsDrawerProps {
  assumptions: ReceiptAssumption[];
  defaultOpen?: boolean;
  className?: string;
}

export function AssumptionsDrawer({
  assumptions,
  defaultOpen = false,
  className = '',
}: AssumptionsDrawerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!assumptions || assumptions.length === 0) {
    return null;
  }

  return (
    <div className={`border-t border-slate-200/70 dark:border-slate-800/80 pt-2.5 mt-2.5 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 py-1.5 focus:outline-hidden cursor-pointer select-none"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-slate-400 dark:text-slate-500">📐</span>
          <span>Scientific Assumptions & Sources ({assumptions.length})</span>
        </span>
        <span
          className={`transform transition-transform text-slate-400 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3 border border-slate-200/60 dark:border-slate-800 text-xs">
          <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium pb-2 border-b border-slate-200 dark:border-slate-800">
            <span>ℹ️</span>
            <span>
              All estimates include parameter uncertainty ranges. Constants calibrated from peer-reviewed literature.
            </span>
          </div>

          <ul className="space-y-2 pt-1">
            {assumptions.map((item, index) => (
              <li
                key={index}
                className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 text-[11px] border-b border-slate-100 dark:border-slate-800/50 last:border-none pb-1.5 last:pb-0"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.label}:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {String(item.value)}{item.unit ? ` ${item.unit}` : ''}
                  </span>
                </div>
                {item.source && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 sm:text-right italic">
                    Source: {item.source}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AssumptionsDrawer;
