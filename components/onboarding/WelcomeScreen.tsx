'use client';

import React, { useEffect, useState } from 'react';
import { Users, Zap } from 'lucide-react';
import { AirRing } from '@/components/air/AirRing';
import { useLedgerStore } from '@/lib/store/ledgerStore';
import { useProfile } from '@/lib/store/ProfileProvider';
import { getDefaultDemoProfile } from '@/lib/store/profileStore';

export interface WelcomeScreenProps {
  onStartSetup?: () => void;
  onTryDemo?: () => void;
}

export function WelcomeScreen({ onStartSetup, onTryDemo }: WelcomeScreenProps) {
  const ledger = useLedgerStore();
  const { setProfile, setDemoMode, setOnboardingComplete } = useProfile();
  const [aqi] = useState<number>(ledger?.currentAQI ?? 167);
  const pm25 = 165; // ~11x WHO 15 µg/m³ guideline

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
    // Default fallback demo action
    const demoProfile = getDefaultDemoProfile();
    setProfile(demoProfile);
    setDemoMode(true);
    setOnboardingComplete(true);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg)] min-h-dvh overflow-y-auto flex flex-col justify-between items-center px-4 py-8 sm:py-12">
      {/* Top Header / Brand */}
      <div className="flex flex-col items-center gap-1.5 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
            सांस <span className="text-[var(--primary)]">Saans</span>
          </span>
        </div>
        <p className="text-xs uppercase tracking-widest text-[var(--muted)] font-semibold">
          Your Family&apos;s Air Coach
        </p>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-lg my-auto py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight leading-tight">
            Know your air. <br className="hidden sm:inline" />
            <span className="text-[var(--primary)]">Act on it.</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)] font-medium">
            Air quality is 11× the WHO safe level today in Delhi
          </p>
        </div>

        {/* AQI Ring Hero */}
        <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <AirRing
            aqi={aqi}
            pm25={pm25}
            whoMultiple={11}
            label="US AQI · Delhi"
            size={190}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-3 pb-4">
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
          className="w-full py-3.5 px-6 rounded-[var(--radius-card)] bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] font-semibold flex items-center justify-center gap-3 hover:bg-[var(--surface-2)] active:scale-[0.99] transition-all text-sm sm:text-base min-h-[48px] cursor-pointer"
        >
          <Zap size={20} className="text-[var(--primary)]" />
          <span>Try a demo family</span>
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
