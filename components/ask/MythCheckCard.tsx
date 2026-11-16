'use client';

import React from 'react';
import { EvidenceBadge } from '@/components/receipt/EvidenceBadge';
import { useTranslation } from '@/lib/i18n';

export interface MythCheckItem {
  claim: string;
  evidenceSays: string;
  whatToDoInstead: string;
  citations?: Array<{ title: string; url: string }>;
}

interface MythCheckCardProps {
  item: MythCheckItem;
  className?: string;
}

export function MythCheckCard({ item, className = '' }: MythCheckCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-gradient-to-b from-rose-50/50 to-white dark:from-rose-950/20 dark:to-slate-900/60 p-5 shadow-xs space-y-4 ${className}`}
    >
      {/* Header with Strikethrough Claim & Grade D Badge */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <span>🚫</span>
            <span>{t('ask.myth_badge')}</span>
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 line-through decoration-rose-500 decoration-2">
            &ldquo;{item.claim}&rdquo;
          </h3>
        </div>
        <EvidenceBadge grade="D" showWhyInline={false} />
      </div>

      {/* What the Evidence Says */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <span>🔬</span>
          <span>{t('ask.myth_what_evidence_says')}</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {item.evidenceSays}
        </p>
      </div>

      {/* What to do instead */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1.5">
        <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
          <span>✅</span>
          <span>{t('ask.myth_what_to_do')}</span>
        </div>
        <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
          {item.whatToDoInstead}
        </p>
      </div>

      {/* Citations if present */}
      {item.citations && item.citations.length > 0 && (
        <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <span className="font-semibold">{t('ask.citations')}</span>
          <div className="flex flex-wrap gap-2">
            {item.citations.map((cite, idx) => (
              <a
                key={idx}
                href={cite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
              >
                <span>🔗</span>
                <span>{cite.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
