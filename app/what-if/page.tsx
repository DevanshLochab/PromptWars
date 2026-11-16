'use client';

import React from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';

export default function WhatIfPage() {
  const { profile } = useProfile();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          What-if Scenario Sandbox
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Simulate interventions and evaluate dual receipts: Breathe (Inhaled) & Give (Emitted).
        </p>
      </div>

      {/* Scenario Compare Selector */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl border-2 border-sky-600 bg-sky-50/50 dark:bg-sky-950/20 text-left space-y-1 cursor-pointer">
          <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300">Scenario A</span>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Baseline (Current)</div>
          <p className="text-[11px] text-slate-500">1 Purifier, Leaky windows, Two-wheeler commute</p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left space-y-1 hover:border-slate-300 cursor-pointer">
          <span className="text-[10px] uppercase font-bold text-slate-500">Scenario B</span>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">+ Gap Sealing & Metro</div>
          <p className="text-[11px] text-slate-500">Foam weatherstripping + Public transit shift</p>
        </div>
      </div>

      {/* Dual Receipt Comparison Preview */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Projected Impact Receipt
        </h2>

        {/* Breathe Impact */}
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
            <span>🌬️ Breathe Impact (What you take in)</span>
            <span className="text-sm font-extrabold">-42%</span>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            Household daily mean PM2.5 inhalation drops from 195 µg/m³ to 113 µg/m³.
          </p>
        </div>

        {/* Give Impact */}
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
            <span>🌍 Give Impact (What you add to airshed)</span>
            <span className="text-sm font-extrabold">-580g CO₂e</span>
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Switching Papa's 24km round-trip from two-wheeler to metro saves ~0.3g fine PM2.5 and 580g CO₂e daily.
          </p>
        </div>

        {/* Cost & Effort Preview */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-slate-400 text-[10px]">Estimated Upfront Cost</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">₹450 (Removable tape)</div>
          </div>
          <div>
            <span className="text-slate-400 text-[10px]">Implementation Effort</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200">Level 2 / 5 (30 mins)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
