'use client';

import React from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';

export default function PlanPage() {
  const { profile } = useProfile();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Tomorrow's Action Plan
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personalized hourly defense plan tailored for {profile?.location.placeName ?? 'your home'}.
        </p>
      </div>

      {/* Plan Status Banner */}
      <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 flex items-start gap-3">
        <span className="text-2xl">📋</span>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-sky-950 dark:text-sky-200">
            24-Hour Smog Inversion Defense Active
          </h2>
          <p className="text-xs text-sky-800 dark:text-sky-300">
            Tomorrow features severe nocturnal boundary layer stagnation. Peak PM2.5 forecast: 380 µg/m³ at 08:30 AM.
          </p>
        </div>
      </div>

      {/* Top 3 High-Impact Interventions Preview */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Top Targeted Actions for Household
        </h2>

        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                1. Aarav (7y, Asthma): Shift Recess Indoors
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                High Impact
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Notify school to substitute morning physical sports with indoor library reading or yoga.
            </p>
            <div className="text-[11px] text-slate-500 flex gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>⏰ Window: 08:00 - 14:00</span>
              <span>💨 Exposure Delta: -45%</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                2. Dadaji (68y, Heart): Avoid Morning Stroll
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                High Impact
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Shift balcony walking to the cleanest afternoon window between 13:00 and 15:00 when solar mixing drops PM2.5 to 180 µg/m³.
            </p>
            <div className="text-[11px] text-slate-500 flex gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>⏰ Window: 06:00 - 09:00</span>
              <span>💨 Exposure Delta: -60%</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                3. Kitchen Exhaust During LPG Cooking
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Source Control
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Run exhaust hood during breakfast and dinner prep; keep running 15 min after burners are off.
            </p>
            <div className="text-[11px] text-slate-500 flex gap-4 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>⏰ Window: 07:30 & 19:30</span>
              <span>💨 NO2 Delta: -70%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
