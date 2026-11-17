'use client';

import React, { useEffect, useState } from 'react';
import { Users, Zap, MapPin, Globe, Check } from 'lucide-react';
import { AirRing } from '@/components/air/AirRing';
import { useLedgerStore } from '@/lib/store/ledgerStore';
import { useProfile } from '@/lib/store/ProfileProvider';
import { getDefaultDemoProfile } from '@/lib/store/profileStore';
import { SUPPORTED_LANGUAGES, useTranslation, Language } from '@/lib/i18n';
import { CitySelector } from '@/components/common/CitySelector';
import { Location } from '@/lib/schemas';
import { getAirQuality } from '@/lib/data/openMeteo';

export interface WelcomeScreenProps {
  onStartSetup?: () => void;
  onTryDemo?: () => void;
}

export function WelcomeScreen({ onStartSetup, onTryDemo }: WelcomeScreenProps) {
  const ledger = useLedgerStore();
  const {
    profile,
    language,
    updateLanguage,
    updateLocation,
    setProfile,
    setDemoMode,
    setOnboardingComplete,
  } = useProfile();
  const { t } = useTranslation();

  const [aqi, setAqi] = useState<number>(ledger?.currentAQI ?? 167);
  const [pm25, setPm25] = useState<number>(165);
  const [isChangingCity, setIsChangingCity] = useState(false);

  const cityName = profile?.location.placeName
    ? profile.location.placeName.split(',')[0].trim()
    : 'New Delhi';

  useEffect(() => {
    // Hide bottom nav and header on mobile while welcome screen is active
    const nav = document.querySelector('nav');
    const header = document.querySelector('header');
    if (nav) nav.style.display = 'none';
    if (header) header.style.display = 'none';
    return () => {
      if (nav) nav.style.display = '';
      if (header) header.style.display = '';
    };
  }, []);

  // Fetch real AQI whenever profile location updates
  useEffect(() => {
    async function loadCityAqi() {
      const lat = profile?.location.lat ?? 28.6139;
      const lon = profile?.location.lon ?? 77.209;
      try {
        const data = await getAirQuality(lat, lon, true);
        if (data && data.length > 0 && data[0]?.usAqi !== undefined) {
          setAqi(data[0].usAqi);
          setPm25(Math.round(data[0].pm25 || (data[0].usAqi * 0.9)));
        }
      } catch {
        // Fallback default
      }
    }
    loadCityAqi();
  }, [profile?.location.lat, profile?.location.lon]);

  const handleStartSetup = () => {
    if (onStartSetup) {
      onStartSetup();
    }
  };

  const handleTryDemo = () => {
    if (onTryDemo) {
      onTryDemo();
      return;
    }
    const demoProfile = getDefaultDemoProfile();
    setProfile(demoProfile);
    setDemoMode(true);
    setOnboardingComplete(true);
  };

  const handleCitySelect = (loc: Location) => {
    updateLocation(loc);
    setIsChangingCity(false);
  };

  const whoMultiple = Math.max(1, Math.round(pm25 / 15));

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg)] min-h-dvh overflow-y-auto flex flex-col justify-between items-center px-4 py-6 sm:py-10">
      {/* Top Header / Brand */}
      <div className="flex flex-col items-center gap-1 w-full max-w-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
            सांस <span className="text-[var(--primary)]">Saans</span>
          </span>
        </div>
        <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-semibold">
          Your Family&apos;s Air Coach
        </p>

        {/* 1. Language Preference Bar (Asked right at the start!) */}
        <div className="w-full mt-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-[var(--text)]">
            <Globe size={14} className="text-[var(--primary)]" />
            <span>Select Language / भाषा चुनें:</span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {SUPPORTED_LANGUAGES.map((l) => {
              const active = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => updateLanguage(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                    active
                      ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
                      : 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)]'
                  }`}
                >
                  {active && <Check size={12} strokeWidth={3} />}
                  <span>{l.native}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. City Selector on Welcome Screen */}
        <div className="w-full mt-2">
          {!isChangingCity ? (
            <button
              type="button"
              onClick={() => setIsChangingCity(true)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs hover:border-[var(--muted)] transition-colors cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-[var(--primary)]" />
                <span className="text-[var(--muted)]">City:</span>
                <span className="font-bold text-[var(--text)]">{cityName}</span>
              </div>
              <span className="text-[11px] font-semibold text-[var(--primary)] group-hover:underline">
                Change City
              </span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md">
              <CitySelector
                currentLocation={profile?.location}
                onSelect={handleCitySelect}
                onCancel={() => setIsChangingCity(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-lg my-auto py-4 space-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight leading-tight">
            Know your air. <br className="hidden sm:inline" />
            <span className="text-[var(--primary)]">Act on it.</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] font-medium">
            Air quality in {cityName} is {whoMultiple}× the WHO safe guideline today
          </p>
        </div>

        {/* AQI Ring Hero */}
        <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <AirRing
            aqi={aqi}
            pm25={pm25}
            whoMultiple={whoMultiple}
            label={`US AQI · ${cityName}`}
            size={180}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-2.5 pb-2">
        <button
          type="button"
          onClick={handleStartSetup}
          className="w-full py-3.5 px-6 rounded-[var(--radius-card)] bg-[var(--primary)] text-[var(--on-primary)] font-semibold flex items-center justify-center gap-3 shadow-md hover:opacity-95 active:scale-[0.99] transition-all text-sm sm:text-base min-h-[48px] cursor-pointer"
        >
          <Users size={20} />
          <span>Set up my family&apos;s plan</span>
        </button>

        <button
          type="button"
          onClick={handleTryDemo}
          className="w-full py-3 px-6 rounded-[var(--radius-card)] bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] font-semibold flex items-center justify-center gap-3 hover:bg-[var(--surface-2)] active:scale-[0.99] transition-all text-sm min-h-[44px] cursor-pointer"
        >
          <Zap size={18} className="text-[var(--primary)]" />
          <span>Try a demo family (Delhi Severe Smog)</span>
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
