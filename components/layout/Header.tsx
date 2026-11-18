'use client';

import React, { useState, useEffect } from 'react';
import { Settings, MapPin } from 'lucide-react';
import { useProfile } from '@/lib/store/ProfileProvider';
import { getAirQuality } from '@/lib/data/openMeteo';
import { useLedgerStore } from '@/lib/store/ledgerStore';
import { useTranslation } from '@/lib/i18n';

export function Header() {
  const { profile, isDemoMode, openSettings } = useProfile();
  const ledger = useLedgerStore();
  const { t } = useTranslation();
  const [currentAqi, setCurrentAqi] = useState<number | null>(ledger?.currentAQI ?? 167);

  const cityName = profile?.location.placeName
    ? profile.location.placeName.split(',')[0].trim()
    : 'New Delhi';

  useEffect(() => {
    async function loadAqi() {
      try {
        const lat = profile?.location.lat ?? 28.6139;
        const lon = profile?.location.lon ?? 77.209;
        const data = await getAirQuality(lat, lon, !isDemoMode);
        if (data && data.length > 0 && data[0]?.usAqi !== undefined) {
          setCurrentAqi(data[0].usAqi);
        }
      } catch {
        // Fallback to ledger default
      }
    }
    loadAqi();
  }, [profile?.location.lat, profile?.location.lon, isDemoMode]);

  const getAqiBadgeColor = (aqi: number | null) => {
    if (aqi === null) return 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]';
    if (aqi <= 50) return 'bg-emerald-500/15 text-[var(--success)] border-emerald-500/30';
    if (aqi <= 100) return 'bg-amber-500/15 text-[var(--warn)] border-amber-500/30';
    if (aqi <= 150) return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
    if (aqi <= 200) return 'bg-rose-500/15 text-[var(--danger)] border-rose-500/30';
    if (aqi <= 300) return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
    return 'bg-red-950/20 text-red-700 dark:text-red-300 border-red-800/40';
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] transition-colors">
      <div className="max-w-md lg:max-w-none mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-[var(--text)]">
            सांस <span className="text-[var(--primary)] font-bold text-lg">Saans</span>
          </span>

          {/* City pill button */}
          <button
            type="button"
            onClick={openSettings}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-pill)] bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            title={t('settings.location_change')}
          >
            <MapPin size={11} className="text-[var(--primary)] shrink-0" />
            <span className="truncate max-w-[100px]">{cityName}</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {currentAqi !== null && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-pill)] border text-xs font-semibold shadow-xs ${getAqiBadgeColor(
                currentAqi
              )}`}
              title={t('aqi.current_outdoor')}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>AQI {currentAqi}</span>
            </div>
          )}

          <button
            onClick={openSettings}
            className="p-2 rounded-[var(--radius-pill)] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
