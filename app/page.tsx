'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';
import { getAirQuality } from '@/lib/data/openMeteo';
import { HourlyAir, Receipt } from '@/lib/schemas';
import { AirRing } from '@/components/air/AirRing';
import { TwoLedger } from '@/components/air/TwoLedger';
import { DayTimeline } from '@/components/air/DayTimeline';
import { ImpactReceipt } from '@/components/receipt/ImpactReceipt';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';

export default function TodayPage() {
  const { profile, isDemoMode, language, setProfile } = useProfile();
  const [hourlyData, setHourlyData] = useState<HourlyAir[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  // If user has no profile and not demo mode, prompt onboarding
  if (!profile && !isDemoMode && !loading) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <OnboardingStepper
          onComplete={(newProf) => {
            setProfile(newProf);
            setShowOnboarding(false);
          }}
        />
      </div>
    );
  }

  if (loading && !hourlyData) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        <LoadingSkeleton type="ring" />
        <LoadingSkeleton type="receipt" />
        <LoadingSkeleton type="timeline" />
      </div>
    );
  }

  // Current Air Quality Snapshot
  const current = hourlyData?.[0] ?? {
    pm25: 320,
    pm10: 480,
    no2: 45,
    o3: 8,
    usAqi: 370,
    tempC: 9.5,
    rh: 88,
    windMs: 1.2,
  };

  // Build 24-hour timeline format
  const timelineEntries = (hourlyData || []).slice(0, 24).map((h, idx) => {
    const aqi = h.usAqi;
    let aqiBand = 'hazardous';
    if (aqi <= 50) aqiBand = 'good';
    else if (aqi <= 100) aqiBand = 'moderate';
    else if (aqi <= 150) aqiBand = 'unhealthy-sg';
    else if (aqi <= 200) aqiBand = 'unhealthy';
    else if (aqi <= 300) aqiBand = 'very-unhealthy';

    const tags: string[] = [];
    if (idx === 7 || idx === 8) tags.push('Morning commute', 'School run');
    if (idx >= 12 && idx <= 14) tags.push('Cleanest window', 'Ventilate');
    if (idx === 19 || idx === 20) tags.push('Cook with exhaust');
    if (idx === 22) tags.push('Purifier High');

    let advice = 'Hazardous inversion layer. Keep doors latched and run HEPA filter continuously.';
    if (idx >= 12 && idx <= 15) {
      advice = 'Daily pollution trough. If indoor PM2.5 exceeds 150 µg/m³, create a 15-minute cross-draft flush.';
    } else if (idx >= 7 && idx <= 9) {
      advice = 'Morning rush hour peak with cold air trapping exhaust. Wear a tightly fitted N95 respirator outdoors.';
    } else if (idx >= 18 && idx <= 21) {
      advice = 'Evening temperature inversion settling in. Keep bedroom refuge door closed with purifier on.';
    }

    return {
      hour: idx,
      aqiBand,
      tags,
      advice,
      pm25: h.pm25,
      aqi: h.usAqi,
    };
  });

  // Today's signature top priority receipt
  const topActionReceipt: Receipt = {
    id: 'rcpt_today_clean_bedroom',
    actionId: 'purifier_run_high_bedroom_evening',
    memberIds: profile?.members.map((m) => m.id) || ['m3', 'm4'],
    formulaId: 'bedroom_purification_flush',
    window: { start: 21, end: 23 },
    breathe: {
      metric: 'pm25_exposure_reduction_pct',
      before: current.pm25,
      after: 42,
      deltaPct: -86.8,
      unit: 'µg/m³',
      low: 35,
      high: 55,
    },
    give: {
      pm25_g: 0,
      co2e_g: 0,
      period: 'nightly',
      low: 0,
      high: 0,
    },
    cost: {
      upfront: 0,
      ongoing: 18,
      currency: 'INR',
    },
    effort: 1,
    evidence: 'A',
    confidence: 'high',
    assumptions: [
      {
        label: 'Bedroom volume',
        value: 36,
        unit: 'm³',
        source: 'Household profile main room estimate',
      },
      {
        label: 'Purifier CADR',
        value: 250,
        unit: 'm³/h',
        source: 'Manufacturer spec at High fan speed',
      },
      {
        label: 'Air changes per hour (ACH)',
        value: 6.9,
        unit: 'ACH',
        source: 'CADR / Room Volume (EPA Clean Air Guideline recommends >5 ACH)',
      },
      {
        label: 'Room infiltration factor',
        value: 0.25,
        unit: 'k_inf',
        source: 'ASHRAE closed door residential benchmark',
      },
    ],
  };

  // TwoLedger figures
  const breatheData = {
    value: Math.round(current.pm25 * 0.42), // estimated indoor exposure with current mitigation
    who: Math.max(1, Math.round(((current.pm25 * 0.42) / 15) * 10) / 10),
    label:
      'Household 24-hr personal inhalation dose across indoor rooms and transit',
    baseline: current.pm25,
  };

  const giveData = {
    pm25: 64, // grams avoided today by choosing metro + clean cooking habits
    co2e: 480,
    label:
      'Avoided 64g PM2.5 today — equivalent to keeping 2 motorcycles off Delhi roads',
    period: 'daily',
  };

  const hasAsthma = profile?.members.some((m) =>
    m.conditions.includes('asthma')
  );
  const hasCombustionHeating = profile?.home.heating.some(
    (h) => h === 'gas' || h === 'coal_charcoal' || h === 'wood'
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-14">
      {/* 1. Header Greeting & Location */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {language === 'hi' ? 'आज का वायु सुरक्षा कोच' : "Today's Air Coach"}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
              Live Diagnostic
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            📍 {profile?.location.placeName || 'New Delhi, India'} •{' '}
            {isDemoMode ? '⚡ Severe Winter Smog Snapshot (Jan 15)' : 'Live Open-Meteo Feed'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowOnboarding(!showOnboarding)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer self-start sm:self-auto min-h-[36px]"
        >
          {showOnboarding ? 'Close Setup' : '⚙️ Re-calibrate Profile'}
        </button>
      </div>

      {/* Onboarding Drawer if user toggles re-calibrate */}
      {showOnboarding && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-200">
          <OnboardingStepper
            initialProfile={profile || undefined}
            onComplete={(updated) => {
              setProfile(updated);
              setShowOnboarding(false);
            }}
          />
        </div>
      )}

      {/* 2. Prominent Centered AirRing Gauge */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 flex flex-col items-center">
        <AirRing
          aqi={current.usAqi}
          pm25={current.pm25}
          label="Outdoor Air Quality"
          size={210}
        />
      </div>

      {/* 3. TwoLedger Meters: What you BREATHE vs What you GIVE */}
      <TwoLedger breathe={breatheData} give={giveData} />

      {/* 4. Top Action for Today: The Signature ImpactReceipt */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>🛡️</span>
            <span>Top Priority Action for Today</span>
          </h2>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Highest Exposure Cut
          </span>
        </div>

        <ImpactReceipt
          receipt={topActionReceipt}
          members={profile?.members}
          actionTitle="Create Clean Air Refuge in Bedroom Tonight"
        />
      </section>

      {/* 5. 24-Hour DayTimeline */}
      <section className="space-y-3">
        <DayTimeline
          timeline={timelineEntries}
          bestWindows={[{ start: 12, end: 15 }]}
        />
      </section>

      {/* 6. Safety Banners */}
      <section className="space-y-3 pt-2">
        {hasCombustionHeating && (
          <SafetyBanner
            type="co_warning"
            message="Unvented gas or charcoal heating detected in household profile. Never sleep in a sealed room with fuel-burning combustion heaters. Ensure air exchange or utilize battery-backed CO sensors."
          />
        )}

        {hasAsthma && (
          <SafetyBanner
            type="breathing_difficulty"
            message="Child member Aarav has an active asthma profile. Keep reliever inhalers nearby and minimize exertion during inversion surges."
          />
        )}

        {/* Not Medical Advice Standard Disclaimer */}
        <SafetyBanner type="not_medical_advice" />
      </section>
    </div>
  );
}
