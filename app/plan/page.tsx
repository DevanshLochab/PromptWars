'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';
import { getDefaultDemoProfile } from '@/lib/store/profileStore';
import { getAirQuality } from '@/lib/data/openMeteo';
import { generateFallbackPlan } from '@/lib/gemini/fallback';
import { Plan, HourlyAir, Action } from '@/lib/schemas';
import { DayTimeline } from '@/components/air/DayTimeline';
import { ImpactReceipt } from '@/components/receipt/ImpactReceipt';
import { MemberTabs } from '@/components/members/MemberTabs';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import { WhatsAppSummary, WhatsAppPlanData } from '@/components/common/WhatsAppSummary';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper';
import {
  createReceiptForAction,
  rankActions,
  bestWindows,
  computeHourlyIndoor,
} from '@/lib/engine';
import actionsData from '@/data/actions.json';

export default function PlanPage() {
  const { profile, isDemoMode, language, setProfile } = useProfile();
  const effectiveProfile = profile || (isDemoMode ? getDefaultDemoProfile() : null);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [hourlyAir, setHourlyAir] = useState<HourlyAir[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMemberId, setActiveMemberId] = useState<string>('');

  useEffect(() => {
    const prof = effectiveProfile;
    if (!prof) return;
    let isMounted = true;

    async function fetchPlan() {
      if (!prof) return;
      setLoading(true);
      setError(null);
      try {
        const airData = await getAirQuality(
          prof.location.lat,
          prof.location.lon,
          !isDemoMode
        );
        if (isMounted) setHourlyAir(airData);

        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: prof }),
        });

        if (res.ok) {
          const data: Plan = await res.json();
          if (isMounted) setPlan(data);
        } else {
          // Fallback to local physics engine plan
          const fallback = generateFallbackPlan(
            prof,
            airData || undefined,
            undefined,
            language
          );
          if (isMounted) setPlan(fallback);
        }
      } catch (err) {
        console.warn('Failed to fetch plan from /api/plan, using engine fallback:', err);
        const airData = await getAirQuality(
          prof.location.lat,
          prof.location.lon,
          !isDemoMode
        );
        if (isMounted) setHourlyAir(airData);
        const fallback = generateFallbackPlan(
          prof,
          airData || undefined,
          undefined,
          language
        );
        if (isMounted) setPlan(fallback);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPlan();
    return () => {
      isMounted = false;
    };
  }, [profile, language, isDemoMode]);

  // If user has no profile and not in demo mode, prompt onboarding
  if (!profile && !isDemoMode && !loading) {
    return (
      <div className="max-w-2xl mx-auto py-4">
        <OnboardingStepper
          onComplete={(newProf) => {
            setProfile(newProf);
          }}
        />
      </div>
    );
  }

  // Loading Skeleton State
  if (loading && !plan) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-14">
        <LoadingSkeleton type="plan" />
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const members = effectiveProfile?.members || [];
  const currentMember =
    members.find((m) => m.id === activeMemberId) || members[0];
  const currentMemberId = currentMember?.id || '';

  const memberTipsObj = plan.perMember.find(
    (pm) => pm.memberId === currentMemberId
  );
  const currentTips = memberTipsObj?.tips || [];

  // Ranked actions for dynamic receipt lookup
  const rankedActions = effectiveProfile
    ? rankActions(effectiveProfile, hourlyAir || undefined)
    : [];

  // Calculate dynamic best ventilation windows
  const outdoorList = (hourlyAir || []).map((h) => h.pm25);
  const indoorResult =
    effectiveProfile && outdoorList.length > 0
      ? computeHourlyIndoor(outdoorList, effectiveProfile)
      : null;

  const hasCombustionHeating = Boolean(
    effectiveProfile?.home.heating.some((h) =>
      ['coal_charcoal', 'wood', 'gas'].includes(h)
    )
  );

  const computedWindows = indoorResult
    ? bestWindows(outdoorList, indoorResult.hourlyIndoor, {
        durationH: 2,
        hasCombustionHeater: hasCombustionHeating,
      })
    : [];

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

  // Enrich timeline entries with live PM2.5 and AQI if available
  const timelineWithAir = plan.timeline.map((entry) => ({
    ...entry,
    pm25: hourlyAir?.[entry.hour]?.pm25,
    aqi: hourlyAir?.[entry.hour]?.usAqi,
  }));

  // Format WhatsApp share data
  const planDataForWhatsApp: WhatsAppPlanData = {
    aqi: hourlyAir?.[0]?.usAqi || 350,
    aqiBand: plan.severityTier,
    topActions: plan.topActions.map((ta, i) => {
      const cleanId = ta.receiptId.replace(/^rcpt_/, '');
      const action =
        actionsData.find((a) => a.id === cleanId) || rankedActions[i]?.action;
      const title = action?.title || ta.why;
      const pct = rankedActions[i]?.receipt.breathe.deltaPct || 35;
      return {
        title,
        impact: `-${pct}% inhalation exposure`,
      };
    }),
    bestVentilationWindow:
      bestWindowsFormatted.length > 0
        ? `${bestWindowsFormatted[0].start}:00 - ${bestWindowsFormatted[0].end}:00`
        : '13:00 - 15:00',
  };

  const formattedGeneratedAt = plan.generatedAt
    ? new Date(plan.generatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '08:30 AM';

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-14">
      {/* Offline Status Notice */}
      <OfflineBanner lastUpdated={formattedGeneratedAt} />

      {/* 1. Headline & Severity Tier */}
      <div className="space-y-3 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {language === 'hi'
              ? 'कल की वायु सुरक्षा योजना'
              : "Tomorrow's Air Protection Plan"}
          </h1>
          <div className="flex items-center gap-2">
            <WhatsAppSummary planData={planDataForWhatsApp} />
            {/* Severity Tier Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span>{plan.severityTier}</span>
            </div>
          </div>
        </div>

        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {plan.headline}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'hi'
            ? 'के लिए निर्धारित 24 घंटे का शेड्यूल'
            : 'Targeted 24-hour schedule calibrated for'}{' '}
          <strong className="text-slate-700 dark:text-slate-300">
            {effectiveProfile?.location.placeName || 'New Delhi, India'}
          </strong>{' '}
          •{' '}
          {isDemoMode
            ? language === 'hi'
              ? '⚡ डेमो पूर्वानुमान मोड'
              : '⚡ Demo Forecast Mode'
            : language === 'hi'
            ? 'लाइव भौतिकी कैलिब्रेशन'
            : 'Live Physics Calibration'}
        </p>
      </div>

      {/* 2. 24-Hour Timeline */}
      <section className="space-y-2">
        <DayTimeline
          timeline={timelineWithAir}
          bestWindows={bestWindowsFormatted}
        />
      </section>

      {/* 3. Top 3 Actions as Signature Impact Receipts */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>📋</span>
            <span>
              {language === 'hi'
                ? 'शीर्ष 3 उच्च-प्रभाव हस्तक्षेप'
                : 'Top 3 High-Impact Interventions'}
            </span>
          </h2>
          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
            {language === 'hi'
              ? 'जोखिम में कमी द्वारा रैंक किया गया'
              : 'Ranked by Exposure Averted'}
          </span>
        </div>

        <div className="space-y-4">
          {plan.topActions.map((topAction, idx) => {
            const cleanId = topAction.receiptId.replace(/^rcpt_/, '');
            const matchedRanked =
              rankedActions.find(
                (r) =>
                  r.receipt.id === topAction.receiptId ||
                  r.action.id === cleanId
              ) || rankedActions[idx];

            const matchedAction =
              (actionsData.find(
                (a) => a.id === cleanId || a.id === matchedRanked?.action.id
              ) as Action | undefined) || matchedRanked?.action;

            const receipt =
              matchedRanked?.receipt ||
              (matchedAction && effectiveProfile
                ? createReceiptForAction(
                    matchedAction,
                    effectiveProfile,
                    hourlyAir || undefined
                  )
                : null);

            const actionTitle =
              matchedAction?.title ||
              matchedRanked?.action.title ||
              topAction.why;

            if (!receipt) return null;

            return (
              <div key={receipt.id + '_' + idx} className="space-y-2">
                <ImpactReceipt
                  receipt={receipt}
                  members={members}
                  actionTitle={actionTitle}
                />
                {(topAction.how || topAction.whenWindow) && (
                  <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
                    {topAction.whenWindow && (
                      <span>
                        <strong className="text-slate-900 dark:text-slate-100">
                          {language === 'hi' ? 'समय:' : 'When:'}
                        </strong>{' '}
                        {topAction.whenWindow}
                      </span>
                    )}
                    {topAction.forWhom && (
                      <span>
                        <strong className="text-slate-900 dark:text-slate-100">
                          {language === 'hi' ? 'किसके लिए:' : 'For Whom:'}
                        </strong>{' '}
                        {topAction.forWhom}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. MemberTabs with Per-Member Tips */}
      {members.length > 0 && currentMember && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>🛡️</span>
              <span>
                {language === 'hi'
                  ? 'व्यक्तिगत पारिवारिक मार्गदर्शन'
                  : 'Individual Family Guidance'}
              </span>
            </h2>
          </div>

          <MemberTabs
            members={members}
            activeId={currentMember.id}
            onChange={(id) => setActiveMemberId(id)}
          />

          {/* Selected Member Guidance Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{language === 'hi' ? 'सलाह:' : 'Guidance for'}</span>
                <span className="text-sky-600 dark:text-sky-400">
                  {currentMember.nickname}
                </span>
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {currentMember.ageBand.toUpperCase()}
              </span>
            </div>

            {currentTips.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {currentTips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-slate-700 dark:text-slate-300 leading-relaxed"
                  >
                    <span
                      className="text-sky-500 font-bold"
                      aria-hidden="true"
                    >
                      •
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">
                {language === 'hi'
                  ? 'इस सदस्य के लिए कोई अतिरिक्त विशेष निर्देश नहीं हैं।'
                  : 'No specific tailored precautions required for this member.'}
              </p>
            )}
          </div>
        </section>
      )}

      {/* 5. Safety Directives */}
      {plan.safetyNotes && plan.safetyNotes.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>⚠️</span>
            <span>
              {language === 'hi' ? 'सुरक्षा निर्देश' : 'Safety Directives'}
            </span>
          </h2>

          {plan.safetyNotes.map((note, idx) => {
            let type: 'co_warning' | 'breathing_difficulty' | 'not_medical_advice' =
              'breathing_difficulty';
            const lower = note.toLowerCase();
            if (
              lower.includes('carbon monoxide') ||
              lower.includes('co ') ||
              lower.includes('combustion') ||
              lower.includes('अंगीठी') ||
              lower.includes('कार्बन')
            ) {
              type = 'co_warning';
            } else if (
              lower.includes('medical') ||
              lower.includes('doctor') ||
              lower.includes('सलाह') ||
              lower.includes('चिकित्सा')
            ) {
              type = 'not_medical_advice';
            }
            return <SafetyBanner key={idx} type={type} message={note} />;
          })}

          {!plan.safetyNotes.some(
            (n) =>
              n.toLowerCase().includes('medical') ||
              n.toLowerCase().includes('doctor')
          ) && <SafetyBanner type="not_medical_advice" />}
        </section>
      )}

      {/* 6. Scientific Citations & Bibliography */}
      {plan.citations && plan.citations.length > 0 && (
        <footer className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2 text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span>📚</span>
            <span>
              {language === 'hi'
                ? 'वैज्ञानिक आधार और साक्ष्य उद्धरण'
                : 'Scientific Basis & Evidence Citations'}
            </span>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside">
            {plan.citations.map((c, idx) => (
              <li key={idx}>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-slate-700 dark:text-slate-300"
                  >
                    {c.title}
                  </a>
                ) : (
                  <span>{c.title}</span>
                )}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </div>
  );
}
