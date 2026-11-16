'use client';

import React, { useState, useEffect } from 'react';
import { SettingsDrawer } from './SettingsDrawer';
import { useProfile } from '@/lib/store/ProfileProvider';
import { getAirQuality } from '@/lib/data/openMeteo';

export function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentAqi, setCurrentAqi] = useState<number | null>(null);
  const { profile, isDemoMode } = useProfile();

  useEffect(() => {
    async function loadAqi() {
      const lat = profile?.location.lat ?? 28.6139;
      const lon = profile?.location.lon ?? 77.209;
      const data = await getAirQuality(lat, lon);
      if (data && data.length > 0) {
        // Use current hour or first hour
        setCurrentAqi(data[0]?.usAqi ?? 370);
      }
    }
    loadAqi();
  }, [profile, isDemoMode]);

  const getAqiBadgeColor = (aqi: number | null) => {
    if (aqi === null) return 'bg-slate-200 text-slate-700';
    if (aqi <= 50) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (aqi <= 100) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (aqi <= 150) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (aqi <= 200) return 'bg-rose-100 text-rose-800 border-rose-300';
    if (aqi <= 300) return 'bg-purple-100 text-purple-800 border-purple-300';
    return 'bg-red-950 text-red-100 border-red-800'; // Hazardous
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-sky-600 dark:text-sky-400">
              सांस <span className="text-slate-900 dark:text-white font-extrabold text-lg">Saans</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-sm bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
              PWA
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {currentAqi !== null && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold shadow-xs ${getAqiBadgeColor(
                  currentAqi
                )}`}
                title="Current Ambient US AQI"
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span>AQI {currentAqi}</span>
              </div>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
