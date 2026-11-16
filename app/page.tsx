'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';
import { getDefaultDemoProfile } from '@/lib/store/profileStore';
import { getAirQuality } from '@/lib/data/openMeteo';
import { HourlyAir } from '@/lib/schemas';
import { AirRing } from '@/components/air/AirRing';
import { TwoLedger } from '@/components/air/TwoLedger';
import { DayTimeline } from '@/components/air/DayTimeline';
import { ImpactReceipt } from '@/components/receipt/ImpactReceipt';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';
import {
  computeHourlyIndoor,
  computeHouseholdExposure,
  rankActions,
  createReceiptForAction,
  bestWindows,
  computeActionEmissions,
} from '@/lib/engine';

export default function TodayPage() {
  const { profile, isDemoMode, language, setProfile } = useProfile();
  const [hourlyData, setHourlyData] = useState<HourlyAir[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      const lat = profile?.location.lat ?? 28.6139;
      const lon = profile?.location.lon ?? 77.209;
      const data = await getAirQuality(lat, lon, !isDemoMode);
      if (isMounted) {
        setHourlyData(data);
        setLoading(false);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [profile?.location.lat, profile?.location.lon, isDemoMode]);

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

  const effectiveProfile = profile || (isDemoMode ? getDefaultDemoProfile() : null);

  // 1. Current Air Quality Snapshot
  const current = hourlyData?.[0] ?? {
    time: new Date().toISOString(),
    pm25: 320,
    pm10: 480,
    no2: 45,
    co: 900,
    o3: 8,
    usAqi: 370,
    tempC: 9.5,
    rh: 88,
    windMs: 1.2,
  };

  // 2. Indoor PM2.5 & Exposure via Physics Engine
  const outdoorList =
    hourlyData && hourlyData.length > 0
      ? hourlyData.map((h) => h.pm25)
      : [current.pm25];

  const indoorResult = effectiveProfile
    ? computeHourlyIndoor(outdoorList, effectiveProfile)
    : { hourlyIndoor: outdoorList.map((c) => Math.round(c * 0.5)), avgIndoor: Math.round(current.pm25 * 0.5), peakIndoor: Math.round(current.pm25 * 0.7) };

  const householdExposure = effectiveProfile
    ? computeHouseholdExposure(effectiveProfile, indoorResult.hourlyIndoor, outdoorList)
    : [];

  const avgExposure =
    householdExposure.length > 0
      ? Math.round(
          householdExposure.reduce((s, m) => s + m.totalExposure, 0) /
            householdExposure.length
        )
      : Math.round(current.pm25 * 0.5);

  // 3. Dynamic Breathe & Give Ledgers
  const breatheData = {
    value: avgExposure,
    who: Math.max(1, Math.round((avgExposure / 15) * 10) / 10),
    label:
      language === 'hi'
        ? 'घर के सदस्यों का औसत इनहेलेशन स्तर (24-घंटे)'
        : 'Household 24-hr personal inhalation dose across indoor rooms and transit',
    baseline: Math.round(current.pm25),
  };

  // 4. Dynamic Ranked Top Action
  const ranked = effectiveProfile
    ? rankActions(effectiveProfile, hourlyData || undefined)
    : [];

  const topRanked = ranked[0];
  const topActionReceipt = topRanked?.receipt ?? (effectiveProfile ? createReceiptForAction(
    {
      id: 'purifier_run_high_bedroom_evening',
      category: 'indoor_cleaning',
      title: 'Create Clean Air Refuge in Bedroom Tonight',
      appliesWhen: 'always',
      costBand: 'none',
      effort: 1,
      evidence: 'A',
      evidenceWhy: 'HEPA filtration removes >99% particulate matter',
      formulaId: 'bedroom_purification',
      giveFactorIds: [],
      whoBenefits: 'All sleeping members',
      steps: ['Run purifier on High before sleep'],
      safetyNotes: [],
    },
    effectiveProfile,
    hourlyData || undefined
  ) : null);

  const topActionTitle =
    topRanked?.action.title ||
    (language === 'hi'
      ? 'आज रात बेडरूम में स्वच्छ हवा का सुरक्षित कमरा बनाएं'
      : 'Create Clean Air Refuge in Bedroom Tonight');

  // Compute avoided community emissions via computeActionEmissions
  let totalAvoidedPm25 = 0;
  let totalAvoidedCo2e = 0;
  if (effectiveProfile && ranked.length > 0) {
    for (const item of ranked.slice(0, 3)) {
      const em = computeActionEmissions(item.action.id, effectiveProfile);
      totalAvoidedPm25 += em.pm25_g;
      totalAvoidedCo2e += em.co2e_g;
    }
    if (totalAvoidedPm25 === 0) {
      for (const item of ranked) {
        const em = computeActionEmissions(item.action.id, effectiveProfile);
        if (em.pm25_g > 0 || em.co2e_g > 0) {
          totalAvoidedPm25 += em.pm25_g;
          totalAvoidedCo2e += em.co2e_g;
          break;
        }
      }
    }
  }

  const avoidedPm25Grams = Math.round(totalAvoidedPm25 * 10) / 10;
  const avoidedCo2eGrams = Math.round(totalAvoidedCo2e);
  const motorcyclesEquiv = Math.max(1, Math.round(avoidedPm25Grams / 30));

  const giveData = {
    pm25: avoidedPm25Grams,
    co2e: avoidedCo2eGrams,
    label:
      language === 'hi'
        ? avoidedPm25Grams > 0
          ? `आज ${avoidedPm25Grams}g PM2.5 उत्सर्जन से बचा — स्वच्छ परिवहन और ईंधन आदतों से`
          : 'स्वच्छ गतिशीलता और ईंधन विकल्पों से सामुदायिक उत्सर्जन बचाएं'
        : avoidedPm25Grams > 0
        ? `Avoided ${avoidedPm25Grams}g PM2.5 today — equivalent to keeping ${motorcyclesEquiv} motorcycle${motorcyclesEquiv > 1 ? 's' : ''} off Delhi roads`
        : 'Community emissions avoided through clean mobility and cooking choices',
    period: 'daily',
  };

  // 5. Dynamic Best Ventilation Windows
  const hasCombustionHeating = Boolean(
    effectiveProfile?.home.heating.some((h) =>
      ['coal_charcoal', 'wood', 'gas'].includes(h)
    )
  );

  const computedWindows = bestWindows(outdoorList, indoorResult.hourlyIndoor, {
    durationH: 2,
    hasCombustionHeater: hasCombustionHeating,
  });

  let bestWindowsFormatted = computedWindows.map((w) => ({
    start: w.startHour,
    end: w.endHour,
  }));

  if (bestWindowsFormatted.length === 0 && outdoorList.length >= 2) {
    let minStart = 12;
    let minSum = Infinity;
    for (let h = 10; h <= Math.min(16, outdoorList.length - 2); h++) {
      const sum = outdoorList[h] + outdoorList[h + 1];
      if (sum < minSum) {
        minSum = sum;
        minStart = h;
      }
    }
    bestWindowsFormatted = [{ start: minStart, end: minStart + 2 }];
  }

  // 6. Dynamic Timeline Entries & Advice
  const timelineEntries = (hourlyData || []).slice(0, 24).map((h, idx) => {
    const aqi = h.usAqi;
    let aqiBand = 'hazardous';
    if (aqi <= 50) aqiBand = 'good';
    else if (aqi <= 100) aqiBand = 'moderate';
    else if (aqi <= 150) aqiBand = 'unhealthy-sg';
    else if (aqi <= 200) aqiBand = 'unhealthy';
    else if (aqi <= 300) aqiBand = 'very-unhealthy';

    const isVentWindow = bestWindowsFormatted.some(
      (w) => idx >= w.start && idx < w.end
    );

    const tags: string[] = [];
    if (isVentWindow) {
      tags.push(language === 'hi' ? 'हवादार खिड़की' : 'Cleanest window');
      tags.push(language === 'hi' ? 'ताजी हवा' : 'Ventilate');
    }
    if (idx >= 7 && idx <= 9) {
      tags.push(language === 'hi' ? 'सुबह का आवागमन' : 'Morning commute');
      tags.push(language === 'hi' ? 'स्कूल का समय' : 'School run');
    }
    if (idx >= 18 && idx <= 20) {
      tags.push(language === 'hi' ? 'खाना पकाने का समय' : 'Cook with exhaust');
    }
    if (idx >= 21 && idx <= 23) {
      tags.push(language === 'hi' ? 'प्यूरीफायर तेज' : 'Purifier High');
    }

    let advice = '';
    if (hasCombustionHeating && isVentWindow) {
      advice =
        language === 'hi'
          ? `जीवन-सुरक्षा वेंटिलेशन (PM2.5 ~${Math.round(h.pm25)} µg/m³)। जहरीली कार्बन मोनोऑक्साइड (CO) से बचाव के लिए खिड़की खुली रखें।`
          : `Life-safety ventilation window (PM2.5 ~${Math.round(h.pm25)} µg/m³). Keep window cracked to prevent carbon monoxide buildup.`;
    } else if (isVentWindow) {
      advice =
        language === 'hi'
          ? `दैनिक प्रदूषण न्यूनतम स्तर (PM2.5 ~${Math.round(h.pm25)} µg/m³)। यदि इनडोर हवा खराब है, तो 15 मिनट के लिए खिड़की खोलें।`
          : `Daily pollution trough (PM2.5 ~${Math.round(h.pm25)} µg/m³). If indoor PM2.5 exceeds outdoor, create a 15-minute cross-draft flush.`;
    } else if (idx >= 7 && idx <= 9) {
      advice =
        language === 'hi'
          ? `सुबह की ठंड और ट्रैफिक से बढ़ता प्रदूषण (AQI ${h.usAqi})। बाहर निकलते समय टाइट-फिटिंग N95 मास्क पहनें।`
          : `Morning rush hour peak with cold air trapping exhaust (AQI ${h.usAqi}). Wear a tightly fitted N95 respirator outdoors.`;
    } else if (idx >= 18 && idx <= 21) {
      advice =
        language === 'hi'
          ? `शाम का तापमान उलटाव (इंवर्जन) शुरू। खाना बनाते समय एग्जॉस्ट फैन चलाएं और बेडरूम का दरवाजा बंद रखें।`
          : `Evening temperature inversion settling in (PM2.5 ~${Math.round(h.pm25)} µg/m³). Keep bedroom refuge door closed with purifier on.`;
    } else if (idx >= 22 || idx <= 5) {
      advice =
        language === 'hi'
          ? `रात की खतरनाक स्मॉग परत। दरवाजे बंद रखें और कमरे में प्यूरीफायर को स्लीप/लो मोड पर चलाएं।`
          : `Hazardous inversion layer. Keep doors latched and run HEPA filter continuously in sleeping areas.`;
    } else if (h.pm25 > 250) {
      advice =
        language === 'hi'
          ? `गंभीर वायु प्रदूषण (PM2.5 ${Math.round(h.pm25)} µg/m³)। भारी बाहरी गतिविधियां रद्द करें।`
          : `Severe air pollution (PM2.5 ${Math.round(h.pm25)} µg/m³). Avoid outdoor exertion and keep indoor refuge sealed.`;
    } else {
      advice =
        language === 'hi'
          ? `औसत बाहरी वायु गुणवत्ता (AQI ${h.usAqi})। इनडोर सुरक्षा बनाए रखें।`
          : `Elevated outdoor particulate smog (AQI ${h.usAqi}). Maintain indoor air filtration and minimize outdoor exposures.`;
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

  // 7. Dynamic Safety Banners
  const asthmaticMembers =
    effectiveProfile?.members.filter((m) =>
      m.conditions.includes('asthma')
    ) || [];

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
            📍 {effectiveProfile?.location.placeName || 'New Delhi, India'} •{' '}
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
            initialProfile={effectiveProfile || undefined}
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
          label={language === 'hi' ? 'बाहरी वायु गुणवत्ता' : 'Outdoor Air Quality'}
          size={210}
        />
      </div>

      {/* 3. TwoLedger Meters: What you BREATHE vs What you GIVE */}
      <TwoLedger breathe={breatheData} give={giveData} />

      {/* 4. Top Action for Today: The Signature ImpactReceipt */}
      {topActionReceipt && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>🛡️</span>
              <span>
                {language === 'hi'
                  ? 'आज की शीर्ष प्राथमिकता कार्रवाई'
                  : 'Top Priority Action for Today'}
              </span>
            </h2>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {language === 'hi' ? 'उच्चतम जोखिम कटौती' : 'Highest Exposure Cut'}
            </span>
          </div>

          <ImpactReceipt
            receipt={topActionReceipt}
            members={effectiveProfile?.members}
            actionTitle={topActionTitle}
          />
        </section>
      )}

      {/* 5. 24-Hour DayTimeline */}
      <section className="space-y-3">
        <DayTimeline
          timeline={timelineEntries}
          bestWindows={bestWindowsFormatted}
        />
      </section>

      {/* 6. Dynamic Safety Banners */}
      <section className="space-y-3 pt-2">
        {hasCombustionHeating && (
          <SafetyBanner
            type="co_warning"
            message={
              language === 'hi'
                ? 'घर की प्रोफाइल में गैस, कोयला या लकड़ी का हीटर पाया गया। बंद कमरे में कभी भी ईंधन हीटर न चलाएं। हवा का प्रवाह सुनिश्चित करें या बैटरी वाला CO अलार्म लगाएं।'
                : 'Unvented gas, coal, or wood heating detected in household profile. Never sleep in a sealed room with fuel-burning combustion heaters. Ensure air exchange or utilize battery-backed CO sensors.'
            }
          />
        )}

        {asthmaticMembers.length > 0 && (
          <SafetyBanner
            type="breathing_difficulty"
            message={
              language === 'hi'
                ? `परिवार के सदस्य ${asthmaticMembers.map((m) => m.nickname).join(', ')} की सक्रिय अस्थमा प्रोफ़ाइल है। रिलीवर इनहेलर पास रखें और स्मॉग के दौरान शारीरिक परिश्रम कम करें।`
                : `${asthmaticMembers.map((m) => m.nickname).join(', ')} has an active asthma profile. Keep reliever inhalers nearby and minimize exertion during inversion surges.`
            }
          />
        )}

        {/* Not Medical Advice Standard Disclaimer */}
        <SafetyBanner type="not_medical_advice" />
      </section>
    </div>
  );
}
