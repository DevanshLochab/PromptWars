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
      {/* Top Header / Brand & Accessible Language Selector Grid */}
      <div className="flex flex-col items-center gap-1 w-full max-w-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
            सांस <span className="text-[var(--primary)]">Saans</span>
          </span>
        </div>
        <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-semibold">
          {t('welcome.subtitle') || "Your Family's Air Coach"}
        </p>

        {/* 1. Prominent High-Contrast Native Script Pill Grid */}
        <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
          {t('welcome.select_language')}
        </p>
        <div
          role="radiogroup"
          aria-label={t('welcome.select_language') || 'Select Language'}
          className="w-full grid grid-cols-3 gap-2 my-3"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={lang.label}
                onClick={() => updateLanguage(lang.code)}
                className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 font-bold'
                    : 'bg-slate-800/80 text-slate-100 hover:bg-slate-700 font-medium border border-slate-700/60'
                }`}
              >
                {active && <Check size={14} strokeWidth={3} className="shrink-0" />}
                <span>{lang.nativeLabel || lang.native}</span>
              </button>
            );
          })}
        </div>

        {/* 2. City Selector on Welcome Screen */}
        <div className="w-full mt-1">
          {!isChangingCity ? (
            <button
              type="button"
              onClick={() => setIsChangingCity(true)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs hover:border-[var(--muted)] transition-colors cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-[var(--primary)]" />
                <span className="text-[var(--muted)]">{t('welcome.city') || 'City:'}</span>
                <span className="font-bold text-[var(--text)]">{cityName}</span>
              </div>
              <span className="text-[11px] font-semibold text-[var(--primary)] group-hover:underline">
                {t('welcome.change_city') || 'Change City'}
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
            {t('welcome.hero_title_line1') || 'Know your air.'} <br className="hidden sm:inline" />
            <span className="text-[var(--primary)]">
              {t('welcome.hero_title_line2') || 'Act on it.'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] font-medium">
            {t('welcome.who_status', { city: cityName, multiple: whoMultiple }) ||
              `Air quality in ${cityName} is ${whoMultiple}× the WHO safe guideline today`}
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
          <span>{t('welcome.setup_btn') || "Set up my family's plan"}</span>
        </button>

        <button
          type="button"
          onClick={handleTryDemo}
          className="w-full py-3 px-6 rounded-[var(--radius-card)] bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] font-semibold flex items-center justify-center gap-3 hover:bg-[var(--surface-2)] active:scale-[0.99] transition-all text-sm min-h-[44px] cursor-pointer"
        >
          <Zap size={18} className="text-[var(--primary)]" />
          <span>{t('welcome.demo_btn') || 'Try a demo family (Delhi Severe Smog)'}</span>
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
