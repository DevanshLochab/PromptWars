'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';
import { getAirQuality } from '@/lib/data/openMeteo';
import { HourlyAir } from '@/lib/schemas';

export default function TodayPage() {
  const { profile, isDemoMode, language } = useProfile();
  const [hourlyData, setHourlyData] = useState<HourlyAir[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const lat = profile?.location.lat ?? 28.6139;
      const lon = profile?.location.lon ?? 77.209;
      const data = await getAirQuality(lat, lon);
      setHourlyData(data);
      setLoading(false);
    }
    fetchData();
  }, [profile, isDemoMode]);

  const current = hourlyData?.[0];

  return (
    <div className="space-y-6">
      {/* Current Conditions Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border border-red-200 dark:border-red-900/40 shadow-xs text-center space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>📍 {profile?.location.placeName ?? 'New Delhi, India'}</span>
          <span>{isDemoMode ? '⚡ Demo Snapshot (Jan 15)' : '🔴 Live Feed'}</span>
        </div>

        {/* AQI Ring */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-36 h-36 rounded-full border-8 border-red-600/20 dark:border-red-500/20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 shadow-inner">
            <span className="text-4xl font-extrabold tracking-tight text-red-600 dark:text-red-400">
              {loading ? '--' : current?.usAqi ?? 370}
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-red-700 dark:text-red-300">
              Hazardous
            </span>
          </div>
          {/* Animated accent ring */}
          <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin-slow" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {language === 'hi' ? 'वायु गुणवत्ता गंभीर है' : 'Severe Air Quality Alert'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
            {language === 'hi'
              ? 'बाहर हवा में अत्यधिक पीएम2.5 कण हैं। खिड़कियां बंद रखें और घर के अंदर रहें।'
              : 'Dense particulate inversion. Keep windows firmly latched and run indoor HEPA filtration.'}
          </p>
        </div>

        {/* Micro-metrics breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-red-200 dark:border-red-900/30 text-xs">
          <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-lg">
            <div className="text-slate-500 text-[10px]">PM2.5</div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {loading ? '...' : `${current?.pm25 ?? 320} µg/m³`}
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-lg">
            <div className="text-slate-500 text-[10px]">Temperature</div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {loading ? '...' : `${current?.tempC ?? 9.5}°C`}
            </div>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-lg">
            <div className="text-slate-500 text-[10px]">Humidity</div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {loading ? '...' : `${current?.rh ?? 88}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Household Profile summary pill */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Household: {profile?.members.length ?? 4} members
          </span>
          <p className="text-slate-500 dark:text-slate-400">
            {profile?.members.some((m) => m.conditions.includes('asthma'))
              ? '⚠️ High-risk respiratory member (Asthma) detected'
              : 'Standard monitoring profile'}
          </p>
        </div>
        <span className="px-2 py-1 rounded-md bg-white dark:bg-slate-700 font-medium text-slate-700 dark:text-slate-200 shadow-2xs">
          Active
        </span>
      </div>

      {/* Daily Guidance Snippet */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <span>🛡️</span>
          <span>Today's Priority Actions</span>
        </h3>

        <div className="space-y-2">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span>Clean Bedroom Refuge</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">Grade A</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Run bedroom purifier on High for 30 minutes before sleep with doors and windows closed.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span>N95 on Two-Wheeler Commute</span>
              <span className="text-sky-600 dark:text-sky-400 text-[11px] font-bold">Grade B</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Rajesh (Papa): Roadside PM2.5 exposure is 3x baseline during 12km transit. Ensure tight nose clip seal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
