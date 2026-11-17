'use client';

import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { useProfile } from '@/lib/store/ProfileProvider';
import { useTranslation } from '@/lib/i18n';
import { getDefaultDemoProfile } from '@/lib/store/profileStore';
import { HourlyAir, Member, HouseholdProfile } from '@/lib/schemas';
import { TwoLedger } from '@/components/air/TwoLedger';
import { ImpactReceipt } from '@/components/receipt/ImpactReceipt';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import {
  computeHourlyIndoor,
  computeHouseholdExposure,
  rankActions,
  createReceiptForAction,
  bestWindows,
  computeActionEmissions,
} from '@/lib/engine';

export interface TodayScreenProps {
  profile?: HouseholdProfile | null;
  hourlyData?: HourlyAir[] | null;
  className?: string;
}

const HI_BANDS: Record<string, string> = {
  Good: 'अच्छा (Good)',
  Moderate: 'मध्यम (Moderate)',
  'Unhealthy for Sensitive Groups': 'संवेदनशील वर्ग हेतु अस्वस्थ',
  Unhealthy: 'अस्वस्थ (Unhealthy)',
  'Very Unhealthy': 'अत्यंत अस्वस्थ (Very Unhealthy)',
  Hazardous: 'अति-गंभीर (Hazardous)',
};

// Band color helper matching Step 1 RightRail
function getBandMeta(aqi: number) {
  if (aqi <= 50) {
    return { band: 'Good', color: 'var(--success)', bg: 'bg-emerald-500' };
  }
  if (aqi <= 100) {
    return { band: 'Moderate', color: '#FBB040', bg: 'bg-amber-500' };
  }
  if (aqi <= 150) {
    return { band: 'Unhealthy for Sensitive Groups', color: '#FF7E00', bg: 'bg-orange-500' };
  }
  if (aqi <= 200) {
    return { band: 'Unhealthy', color: 'var(--danger)', bg: 'bg-red-500' };
  }
  if (aqi <= 300) {
    return { band: 'Very Unhealthy', color: '#8F3F97', bg: 'bg-purple-600' };
  }
  return { band: 'Hazardous', color: '#7E0023', bg: 'bg-rose-950' };
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export function TodayScreen({
  profile: propProfile,
  hourlyData: propHourlyData,
  className = '',
}: TodayScreenProps) {
  const store = useProfile();
  const { lang } = useTranslation();
  const isHi = lang === 'hi';
  const effectiveProfile =
    propProfile || store.profile || (store.isDemoMode ? getDefaultDemoProfile() : null);
  const cityName = effectiveProfile?.location?.placeName?.split(',')[0] || 'New Delhi';

  // 1. Air Quality Data Snapshot
  const current = propHourlyData?.[0] ?? {
    time: new Date().toISOString(),
    pm25: 110,
    pm10: 210,
    no2: 38,
    co: 750,
    o3: 12,
    usAqi: 167,
    tempC: 14,
    rh: 72,
    windMs: 1.8,
  };

  const aqi = current.usAqi;
  const pm25 = current.pm25;
  const { band, color: bandColor } = getBandMeta(aqi);

  // Conversion: PM2.5 / 15 µg/m³, rounded to 1 decimal
  const whoMultiple = Math.max(1, Math.round((pm25 / 15) * 10) / 10);

  // 2. Outdoor & Indoor Exposure Modeling
  const outdoorList = useMemo(() => {
    if (propHourlyData && propHourlyData.length > 0) {
      return propHourlyData.map((h) => h.pm25);
    }
    return [pm25];
  }, [propHourlyData, pm25]);

  const indoorResult = useMemo(() => {
    if (effectiveProfile) {
      return computeHourlyIndoor(outdoorList, effectiveProfile);
    }
    return {
      hourlyIndoor: outdoorList.map((c) => Math.round(c * 0.45)),
      avgIndoor: Math.round(pm25 * 0.45),
      peakIndoor: Math.round(pm25 * 0.65),
    };
  }, [effectiveProfile, outdoorList, pm25]);

  const householdExposure = useMemo(() => {
    if (effectiveProfile) {
      return computeHouseholdExposure(effectiveProfile, indoorResult.hourlyIndoor, outdoorList);
    }
    return [];
  }, [effectiveProfile, indoorResult.hourlyIndoor, outdoorList]);

  const avgExposure = useMemo(() => {
    if (householdExposure.length > 0) {
      return Math.round(
        householdExposure.reduce((s, m) => s + m.totalExposure, 0) / householdExposure.length
      );
    }
    return Math.round(pm25 * 0.5);
  }, [householdExposure, pm25]);

  // 3. Dynamic Breathe & Give Ledgers
  const breatheData = {
    value: avgExposure,
    who: Math.max(1, Math.round((avgExposure / 15) * 10) / 10),
    label: 'Family average daily inhalation exposure based on home infiltration and transit routines.',
    baseline: Math.round(pm25),
  };

  // Ranked Top Action
  const ranked = useMemo(() => {
    if (effectiveProfile) {
      return rankActions(effectiveProfile, propHourlyData || undefined);
    }
    return [];
  }, [effectiveProfile, propHourlyData]);

  const topRanked = ranked[0];
  const topActionReceipt = useMemo(() => {
    if (topRanked?.receipt) return topRanked.receipt;
    if (effectiveProfile) {
      return createReceiptForAction(
        {
          id: 'purifier_run_high_bedroom_evening',
          category: 'indoor_cleaning',
          title: 'Run Purifier on High Tonight',
          appliesWhen: 'always',
          costBand: 'none',
          effort: 1,
          evidence: 'A',
          evidenceWhy: 'HEPA filtration removes >99% fine particulate matter',
          formulaId: 'bedroom_purification',
          giveFactorIds: [],
          whoBenefits: 'All sleeping members',
          steps: ['Run purifier on High before sleep in sealed bedroom'],
          safetyNotes: [],
        },
        effectiveProfile,
        propHourlyData || undefined
      );
    }
    return null;
  }, [topRanked, effectiveProfile, propHourlyData]);

  const topActionTitle = topRanked?.action.title || 'Run your purifier on high tonight';

  // Compute avoided community emissions
  const { avoidedPm25Grams, avoidedCo2eGrams } = useMemo(() => {
    let totalPm25 = 0;
    let totalCo2e = 0;
    if (effectiveProfile && ranked.length > 0) {
      for (const item of ranked.slice(0, 3)) {
        const em = computeActionEmissions(item.action.id, effectiveProfile);
        totalPm25 += em.pm25_g;
        totalCo2e += em.co2e_g;
      }
    }
    return {
      avoidedPm25Grams: Math.round(totalPm25 * 10) / 10,
      avoidedCo2eGrams: Math.round(totalCo2e),
    };
  }, [effectiveProfile, ranked]);

  const giveData = {
    pm25: avoidedPm25Grams,
    co2e: avoidedCo2eGrams,
    label:
      avoidedPm25Grams > 0
        ? `Clean transport & energy habits avoid ~${avoidedPm25Grams}g PM2.5 today — like taking a diesel car off city roads.`
        : 'Avoid vehicle idling and use clean cooking ventilation to reduce neighbourhood air burden.',
    period: 'daily',
  };

  // 4. Best Times & 24h Blocks
  const hasCombustionHeating = Boolean(
    effectiveProfile?.home.heating.some((h: string) => ['coal_charcoal', 'wood', 'gas'].includes(h))
  );

  const ventWindows = useMemo(() => {
    const computed = bestWindows(outdoorList, indoorResult.hourlyIndoor, {
      durationH: 2,
      hasCombustionHeater: hasCombustionHeating,
    });
    if (computed.length > 0) {
      return computed.map((w) => ({ start: w.startHour, end: w.endHour }));
    }
    return [{ start: 13, end: 15 }];
  }, [outdoorList, indoorResult.hourlyIndoor, hasCombustionHeating]);

  const bestWindow = ventWindows[0] || { start: 13, end: 15 };

  // 24-hour block data
  const hourly24 = useMemo(() => {
    if (propHourlyData && propHourlyData.length >= 24) {
      return propHourlyData.slice(0, 24);
    }
    // Synthesize realistic diurnal cycle if partial
    return Array.from({ length: 24 }).map((_, h) => {
      // Inversion peak at morning (7-9 AM) and night (9 PM-1 AM), trough at afternoon (1-3 PM)
      let factor = 1.0;
      if (h >= 7 && h <= 9) factor = 1.35;
      else if (h >= 13 && h <= 15) factor = 0.55;
      else if (h >= 21 || h <= 3) factor = 1.25;
      const hAqi = Math.round(aqi * factor);
      return {
        hour: h,
        usAqi: hAqi,
        meta: getBandMeta(hAqi),
      };
    });
  }, [propHourlyData, aqi]);

  // Family members list
  const members: Member[] = effectiveProfile?.members || [];

  // Helper for Member status
  const getMemberStatus = (m: Member) => {
    const isVulnerable =
      m.conditions.some((c) => c !== 'none') ||
      m.ageBand === 'infant' ||
      m.ageBand === 'toddler' ||
      m.ageBand === 'senior';

    let statusChip = 'OK outdoors';
    let statusType: 'danger' | 'warn' | 'success' = 'success';
    let reason = 'Normal routine acceptable outdoors';

    if (isVulnerable) {
      if (aqi > 100) {
        statusChip = isHi ? 'घर में रहें' : 'Stay in';
        statusType = 'danger';
        if (m.conditions.includes('asthma')) {
          reason = isHi ? 'सर्द धुंध के दौरान अस्थमा ट्रिगर्स चरम पर होते हैं' : 'Asthma triggers peak during cold smog spikes';
        } else if (m.ageBand === 'infant' || m.ageBand === 'toddler') {
          reason = isHi ? 'विकसित हो रहे फेफड़ों को निरंतर छनी हुई हवा चाहिए' : 'Developing airways need continuous filtered air';
        } else if (m.ageBand === 'senior') {
          reason = isHi ? 'उच्च AQI में हृदय और फेफड़ों पर दबाव बढ़ जाता है' : 'Cardiovascular strain elevated in high AQI';
        } else {
          reason = isHi ? 'स्वास्थ्य स्थिति के कारण इनडोर सुरक्षा आवश्यक है' : 'Pre-existing health condition requires indoor protection';
        }
      } else if (aqi > 50) {
        statusChip = isHi ? 'मास्क पहनें' : 'Mask up outside';
        statusType = 'warn';
        reason = isHi ? 'लंबे समय तक बाहर रहने पर N95 मास्क पहनें' : 'Wear fitted N95 mask for prolonged outdoor activities';
      }
    } else {
      if (aqi > 150) {
        statusChip = isHi ? 'घर में रहें' : 'Stay in';
        statusType = 'danger';
        reason = isHi ? 'हवा जहरीली है — बाहरी मेहनत से बचें' : 'Unhealthy particulate levels — avoid outdoor exertion';
      } else if (aqi > 100) {
        statusChip = isHi ? 'मास्क पहनें' : 'Mask up outside';
        statusType = 'warn';
        if (m.commute.mode === 'two_wheeler' || m.commute.mode === 'walk') {
          reason = isHi ? 'सड़क पर आवागमन के दौरान अधिक जहरीले कण मिलते हैं' : 'High exposure along traffic corridor during commute';
        } else {
          reason = isHi ? 'बाहर रहने के दौरान N95 रेस्पिरेटर पहनें' : 'Wear an N95 respirator during outdoor hours';
        }
      } else {
        statusChip = isHi ? 'बाहर सुरक्षित' : 'OK outdoors';
        statusType = 'success';
        reason = isHi ? 'सामान्य आवाजाही के लिए हवा स्वीकार्य है' : 'Air quality acceptable for normal outdoor movement';
      }
    }

    return { statusChip, statusType, reason };
  };

  const asthmaticMembers = members.filter((m) => m.conditions.includes('asthma'));

  return (
    <div className={`space-y-6 max-w-3xl mx-auto pb-16 ${className}`}>
      {/* 1. Air Now Hero */}
      <section
        role="region"
        aria-label="Air Now current conditions"
        className="rounded-[var(--radius-card)] p-6 sm:p-8 bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col items-center text-center"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
            {isHi ? 'US AQI · १२ मिनट पहले अपडेट' : 'US AQI · updated 12 min ago'}
          </span>
          <span className="text-xs text-[var(--muted)]">·</span>
          <button
            type="button"
            onClick={store.openSettings}
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
            title="Change City"
          >
            <MapPin size={12} />
            <span>{cityName}</span>
          </button>
        </div>

        {/* Large AQI Number styled with band color */}
        <div
          className="text-6xl sm:text-7xl font-black tracking-tight my-1"
          style={{ color: bandColor }}
        >
          {aqi}
        </div>

        {/* Band label: e.g. "Very Unhealthy" */}
        <div
          className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1"
          style={{ color: bandColor }}
        >
          {isHi ? HI_BANDS[band] || band : band}
        </div>

        {/* Conversion vs WHO guideline */}
        <p className="text-sm sm:text-base font-semibold text-[var(--text)] mt-2">
          {isHi
            ? `WHO दैनिक मानक से लगभग ${whoMultiple}× गुना`
            : `About ${whoMultiple}× the WHO daily guideline`}
        </p>

        {/* PM2.5 small and muted */}
        <p className="text-xs text-[var(--muted)] mt-1">
          PM2.5: {Math.round(pm25)} µg/m³
        </p>
      </section>

      {/* 2. Family Member Strip */}
      {members.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
              {isHi ? 'परिवार के सदस्यों की स्थिति' : 'Family Member Status'}
            </h2>
            <span className="text-xs text-[var(--muted)]">
              {isHi ? `${members.length} सदस्य` : `${members.length} ${members.length === 1 ? 'member' : 'members'}`}
            </span>
          </div>

          <div className="flex overflow-x-auto sm:flex-wrap gap-3 pb-2 scrollbar-hide">
            {members.map((member) => {
              const { statusChip, statusType, reason } = getMemberStatus(member);
              const initial = member.nickname.charAt(0).toUpperCase();

              const chipStyles = {
                danger:
                  'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800',
                warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
                success:
                  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
              }[statusType];

              return (
                <div
                  key={member.id}
                  className="min-w-[200px] flex-1 sm:min-w-[210px] p-3.5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-2xs flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--on-primary)] font-extrabold text-xs flex items-center justify-center shrink-0">
                        {initial}
                      </span>
                      <span className="font-bold text-sm text-[var(--text)] truncate max-w-[110px]">
                        {member.nickname}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${chipStyles}`}
                    >
                      {statusChip}
                    </span>
                  </div>

                  {/* ONE reason line */}
                  <p className="text-xs text-[var(--muted)] leading-snug">
                    {reason}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Top Action Today */}
      {topActionReceipt && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[var(--text)] tracking-tight">
              {isHi ? 'आज का सबसे असरदार कदम' : 'Your top action today'}
            </h2>
            <span className="text-xs font-semibold text-[var(--primary)]">
              {isHi ? 'सर्वोच्च प्राथमिकता' : 'Ranked highest impact'}
            </span>
          </div>

          <ImpactReceipt
            receipt={topActionReceipt}
            members={members}
            actionTitle={topActionTitle}
          />
        </section>
      )}

      {/* 4. Best Times Strip */}
      <section className="space-y-2.5 rounded-[var(--radius-card)] p-4 sm:p-5 bg-[var(--surface)] border border-[var(--border)] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[var(--text)]">
              {isHi ? 'आज का सबसे अच्छा समय' : 'Best Times Today'}
            </h3>
            <p className="text-xs text-[var(--muted)]">
              {isHi
                ? '24 घंटे के चक्र में प्रति घंटे का US AQI'
                : 'Hourly US AQI bands across the 24-hour diurnal cycle'}
            </p>
          </div>

          {/* 3 labeled windows */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {isHi
                ? `खिड़की: ${formatHour(bestWindow.start)}–${formatHour(bestWindow.end)}`
                : `Best window: ${formatHour(bestWindow.start)}–${formatHour(bestWindow.end)}`}
            </span>
            <span className="px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              {isHi ? 'बचें: 7–10 AM' : 'Avoid: 7–10 AM'}
            </span>
            <span className="px-2.5 py-1 rounded-full font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              {isHi ? 'प्यूरीफायर हाई: 9 PM–6 AM' : 'Purifier high: 9 PM–6 AM'}
            </span>
          </div>
        </div>

        {/* 24 colored blocks (one per hour) */}
        <div className="pt-2">
          <div className="flex items-center gap-1 w-full h-7 rounded-lg overflow-hidden p-0.5 bg-[var(--surface-2)]">
            {hourly24.map((item, idx) => {
              const meta = 'meta' in item ? item.meta : getBandMeta(item.usAqi);
              const inVent = idx >= bestWindow.start && idx < bestWindow.end;
              return (
                <div
                  key={idx}
                  title={`${formatHour(idx)}: ${meta.band} (AQI ${item.usAqi})`}
                  className={`flex-1 h-full rounded-xs transition-opacity hover:opacity-100 relative group cursor-pointer ${
                    inVent ? 'ring-2 ring-emerald-400 z-10' : 'opacity-85'
                  }`}
                  style={{ backgroundColor: meta.color }}
                />
              );
            })}
          </div>

          {/* Quick hour scale labels */}
          <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1.5 font-medium px-0.5">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>11 PM</span>
          </div>
        </div>
      </section>

      {/* 5. Two Ledgers Section */}
      <section className="space-y-2.5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
          {isHi ? 'वायु गुणवत्ता खाते (Air Ledgers)' : 'Air Ledgers'}
        </h2>
        <TwoLedger breathe={breatheData} give={giveData} />
      </section>

      {/* 6. Dynamic Safety Alerts (if applicable) */}
      <section className="space-y-3 pt-2">
        {hasCombustionHeating && (
          <SafetyBanner
            type="co_warning"
            message="Unvented gas, coal, or wood heating detected in household profile. Never sleep in a sealed room with fuel-burning combustion heaters. Ensure air exchange or utilize battery-backed CO sensors."
          />
        )}

        {asthmaticMembers.length > 0 && (
          <SafetyBanner
            type="breathing_difficulty"
            message={`${asthmaticMembers.map((m) => m.nickname).join(', ')} has an active asthma profile. Keep reliever inhalers nearby and minimize exertion during smog surges.`}
          />
        )}

        <SafetyBanner type="not_medical_advice" />
      </section>
    </div>
  );
}

export default TodayScreen;
