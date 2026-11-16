'use client';

import React from 'react';

export interface TwoLedgerProps {
  breathe: {
    value: number; // e.g. current exposure in µg/m³
    who: number; // e.g. WHO ratio multiplier (e.g. 12.3)
    label: string; // e.g. "Estimated 24-hr personal inhalation dose"
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

  // Breathe meter calculation: percentage of max visualization scale (e.g. 350)
  const maxScale = Math.max(300, breathe.baseline || breathe.value * 1.3);
  const currentPct = Math.min(100, Math.max(5, (breathe.value / maxScale) * 100));
  const whoMarkPct = Math.min(100, (whoThreshold / maxScale) * 100);

  return (
    <div
      role="region"
      aria-label="Two Ledger: Personal Exposure vs Community Emissions"
      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}
    >
      {/* 1. BREATHE LEDGER (Blue / Slate tones) */}
      <div className="rounded-2xl p-4 sm:p-5 border border-sky-200 dark:border-sky-900/60 bg-gradient-to-br from-sky-50/80 to-slate-50/50 dark:from-sky-950/30 dark:to-slate-900/40 shadow-xs flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
              <span>🫁</span>
              <span>What you BREATHE</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-900/70 text-sky-800 dark:text-sky-200">
              Personal Exposure
            </span>
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {breathe.value}{' '}
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              µg/m³ 24h avg
            </span>
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            {breathe.label}
          </p>
        </div>

        {/* Meter Gauge */}
        <div className="space-y-1.5">
          <div className="relative w-full h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            {/* WHO Safe Target Anchor */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-emerald-500 rounded-l-full"
              style={{ width: `${whoMarkPct}%` }}
              title="WHO 24h Guideline: 15 µg/m³"
            />
            {/* Current Exposure Bar */}
            <div
              className="absolute top-0 bottom-0 bg-sky-600 dark:bg-sky-400 rounded-full opacity-85 transition-all duration-700"
              style={{ width: `${currentPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              ● WHO safe target (15 µg/m³)
            </span>
            <span className="font-extrabold text-sky-700 dark:text-sky-300">
              ×{whoRatio} WHO Guideline
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">
          *Calculated from micro-environment infiltration & activity model
        </div>
      </div>

      {/* 2. GIVE LEDGER (Emerald / Green tones) */}
      <div className="rounded-2xl p-4 sm:p-5 border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/30 dark:to-slate-900/40 shadow-xs flex flex-col justify-between space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <span>🌱</span>
              <span>What you GIVE to the air</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200">
              Community Shield
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
              {give.pm25 > 0 ? `-${give.pm25}g` : '0g'}
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">
                PM2.5 avoided
              </span>
            </div>
            {give.co2e > 0 && (
              <div className="text-xs font-bold text-teal-700 dark:text-teal-300">
                (-{give.co2e}g CO₂e)
              </div>
            )}
          </div>

          <p className="text-xs text-emerald-900 dark:text-emerald-200 font-semibold leading-relaxed">
            {give.label}
          </p>
        </div>

        {/* Clean Air Impact Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(15, (give.pm25 / 150) * 100))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            <span>Clean habits avoid toxic airshed burden</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              Clean Air Contributor
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">
          *Estimates based on vehicle, cooking & fuel emission factors
        </div>
      </div>
    </div>
  );
}

export default TwoLedger;
