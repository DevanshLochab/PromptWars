'use client';

import React from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';

export default function CommunityPage() {
  const { profile } = useProfile();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Community Clean Air Hub
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Collective action, RWA initiatives, and neighborhood airshed stewardship.
        </p>
      </div>

      {/* Community Code Header */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500">Airshed Zone</span>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {profile?.communityCode ?? 'DELHI-CENTRAL'}
          </div>
        </div>
        <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors">
          Change Hub
        </button>
      </div>

      {/* Active Community Campaigns */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">
          Active Local Initiatives
        </h2>

        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                🧤 Night Guard Warmth Kiosk & Blanket Drive
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full">
                18 Pledged
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Replacing open scrap wood and plastic security bonfires with radiant heaters and insulated thermal jackets.
            </p>
            <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-3/4 rounded-full" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                🛑 School Gate Anti-Idling Zone
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Parent-volunteer roster asking waiting car and auto drivers to cut engines during afternoon school pickup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
