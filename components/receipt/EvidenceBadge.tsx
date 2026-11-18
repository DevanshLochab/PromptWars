'use client';

import React, { useState } from 'react';
import { EvidenceGradeEnum } from '@/lib/schemas';
import { z } from 'zod';

export type EvidenceGrade = z.infer<typeof EvidenceGradeEnum>;

export interface EvidenceBadgeProps {
  grade: EvidenceGrade;
  why?: string;
  showWhyInline?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

export function EvidenceBadge({
  grade,
  why,
  showWhyInline = false,
  align = 'right',
  className = '',
}: EvidenceBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getGradeMeta = (g: EvidenceGrade) => {
    switch (g) {
      case 'A':
        return {
          label: 'Grade A',
          tag: 'Gold Standard',
          desc: 'High certainty. Supported by multiple randomized controlled trials, chamber studies, or official WHO/CDC consensus guidelines.',
          badgeClass:
            'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800',
          dotClass: 'bg-emerald-500',
          icon: '🛡️',
        };
      case 'B':
        return {
          label: 'Grade B',
          tag: 'Strong Field Evidence',
          desc: 'Moderate-high certainty. Supported by peer-reviewed field trials, well-established physics modeling, or EPA/ASHRAE engineering standards.',
          badgeClass:
            'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/70 dark:text-sky-200 dark:border-sky-800',
          dotClass: 'bg-sky-500',
          icon: '🔬',
        };
      case 'C':
        return {
          label: 'Grade C',
          tag: 'Preliminary / Heuristic',
          desc: 'Moderate certainty. Observational data, expert panel heuristics, or preliminary field measurements with higher localized variability.',
          badgeClass:
            'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800',
          dotClass: 'bg-amber-500',
          icon: '📊',
        };
      case 'D':
        return {
          label: 'Grade D',
          tag: 'Myth / Disproven',
          desc: 'Ineffective or potentially hazardous. Common folklore, debunked commercial devices (e.g. ozone generators), or unsubstantiated remedies.',
          badgeClass:
            'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800 line-through decoration-rose-600',
          dotClass: 'bg-rose-500',
          icon: '🚫',
        };
    }
  };

  const meta = getGradeMeta(grade);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`${meta.label}: ${meta.tag}. Click to view scientific basis.`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer select-none min-h-[30px] focus:outline-hidden focus:ring-2 focus:ring-slate-400 ${meta.badgeClass}`}
      >
        <span aria-hidden="true" className="text-xs">
          {meta.icon}
        </span>
        <span>{grade === 'D' ? 'Myth (Grade D)' : meta.label}</span>
        <span
          className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`}
          aria-hidden="true"
        />
      </button>

      {/* Popover / Expandable scientific explanation */}
      {isOpen && (
        <div
          role="tooltip"
          className={`absolute z-30 ${
            align === 'left' ? 'left-0' : 'right-0'
          } mt-1.5 w-64 max-w-[calc(100vw-2rem)] p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl text-left text-xs space-y-1.5 animate-in fade-in duration-150`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <span>{meta.icon}</span> {meta.label} — {meta.tag}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-1"
              aria-label="Close evidence details"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {why || meta.desc}
          </p>
        </div>
      )}

      {showWhyInline && why && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal italic">
          {why}
        </p>
      )}
    </div>
  );
}

export default EvidenceBadge;
