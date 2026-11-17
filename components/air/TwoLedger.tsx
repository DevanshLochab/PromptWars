'use client';

import React from 'react';

export interface TwoLedgerProps {
  breathe: {
    value: number; // e.g. current exposure in µg/m³
    who: number; // e.g. WHO ratio multiplier (e.g. 12.3)
    label: string; // plain language label
    baseline?: number; // baseline exposure before interventions
  };
  give: {
    pm25: number; // grams of PM2.5 avoided or produced
    co2e: number; // grams of CO2e avoided or produced
    label: string; // plain language equivalent
    period?: string;
  };
  className?: string;
}

export function TwoLedger({ breathe, give, className = '' }: TwoLedgerProps) {
  // WHO guideline threshold for PM2.5 is 15 µg/m³ (24-hour mean)
  const whoThreshold = 15;
  const whoRatio =
    breathe.who || Math.max(1, Math.round((breathe.value / whoThreshold) * 10) / 10);

  // Breathe meter calculation: percentage of max visualization scale
  const maxScale = Math.max(300, (breathe.baseline || breathe.value) * 1.25);
  const currentPct = Math.min(100, Math.max(6, (breathe.value / maxScale) * 100));
  const whoMarkPct = Math.min(100, (whoThreshold / maxScale) * 100);

  // Give meter status: green if avoiding emissions / below average, amber if neutral/above
  const isCleanContributor = give.pm25 > 0 || give.co2e > 0;

  return (
    <div
      role="region"
      aria-label="Two Ledgers: What you breathe vs What you add to the air"
      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}
    >
      {/* 1. BREATHE LEDGER: What you breathe today */}
      <div className="rounded-[var(--radius-card)] p-4 sm:p-5 border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between space-y-4 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
              <span>🫁</span>
              <span>What you BREATHE</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300">
              Today&apos;s Air Inhaled
            </span>
          </div>

          <p className="text-xs text-[var(--muted)] font-medium">What you breathe today</p>

          {/* Big number: Nx the guideline */}
          <div className="pt-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
              {whoRatio}× the guideline
            </div>
            {/* Muted µg/m³ below, not in headline */}
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {breathe.value} µg/m³ 24h household average
            </p>
          </div>
        </div>

        {/* Meter Gauge: bar showing family total PM2.5 vs WHO 15 µg/m³ guideline */}
        <div className="space-y-2">
          <div className="relative w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            {/* WHO Safe Target Anchor */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[var(--success)] rounded-l-full z-10"
              style={{ width: `${whoMarkPct}%` }}
              title="WHO guideline: 15 µg/m³"
            />
            {/* Current Exposure Bar */}
            <div
              className="absolute top-0 bottom-0 bg-sky-600 dark:bg-sky-400 rounded-full opacity-90 transition-all duration-700"
              style={{ width: `${currentPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--success)] font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] inline-block" />
              WHO guideline (15 µg/m³)
            </span>
            <span className="font-bold text-sky-700 dark:text-sky-300">
              Family level
            </span>
          </div>
        </div>

        <p className="text-xs text-[var(--muted)] leading-relaxed pt-1 border-t border-[var(--border)]/60">
          {breathe.label}
        </p>
      </div>

      {/* 2. GIVE LEDGER: What you add to the air */}
      <div className="rounded-[var(--radius-card)] p-4 sm:p-5 border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between space-y-4 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isCleanContributor
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-amber-800 dark:text-amber-300'
            }`}>
              <span>🌱</span>
              <span>What you GIVE</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isCleanContributor
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
            }`}>
              {isCleanContributor ? 'Cleaner than Average' : 'Above Average'}
            </span>
          </div>

          <p className="text-xs text-[var(--muted)] font-medium">What you add to the air</p>

          {/* Big number */}
          <div className="pt-1">
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isCleanContributor
                ? 'text-[var(--success)]'
                : 'text-[var(--warn)]'
            }`}>
              {give.pm25 > 0 ? `-${give.pm25}g` : '0g'}
              <span className="text-sm font-semibold text-[var(--muted)] ml-1.5">
                {isCleanContributor ? 'PM2.5 avoided' : 'net added'}
              </span>
            </div>
            {give.co2e > 0 && (
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                Saves ~{give.co2e >= 1000 ? `${(give.co2e / 1000).toFixed(1)} kg` : `${give.co2e}g`} CO₂e
              </p>
            )}
          </div>
        </div>

        {/* Clean Air Impact Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isCleanContributor
                  ? 'bg-[var(--success)]'
                  : 'bg-[var(--warn)]'
              }`}
              style={{
                width: `${Math.min(100, Math.max(15, (Math.abs(give.pm25) / 120) * 100))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>Everyday habits</span>
            <span className="font-bold text-[var(--text)]">
              {isCleanContributor ? 'Shielding neighbourhood' : 'Air burden'}
            </span>
          </div>
        </div>

        {/* Everyday equivalent line */}
        <p className="text-xs text-[var(--text)] font-medium leading-relaxed pt-1 border-t border-[var(--border)]/60">
          {give.label}
        </p>
      </div>
    </div>
  );
}

export default TwoLedger;
