'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';
import { getDefaultDemoProfile } from '@/lib/store/profileStore';
import { getAirQuality } from '@/lib/data/openMeteo';
import { generateFallbackPlan } from '@/lib/gemini/fallback';
import { Plan, HourlyAir, Action } from '@/lib/schemas';
import { DayTimeline } from '@/components/air/DayTimeline';
import { ImpactReceipt } from '@/components/receipt/ImpactReceipt';
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
import { AlertTriangle, Share2, Copy, Check, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function PlanPage() {
  const { profile, isDemoMode, language, setProfile } = useProfile();
  const { t } = useTranslation();
  const effectiveProfile = profile || (isDemoMode ? getDefaultDemoProfile() : null);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [hourlyAir, setHourlyAir] = useState<HourlyAir[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  useEffect(() => {
    const prof = effectiveProfile;
    if (!prof) return;
    let isMounted = true;

    async function fetchPlan() {
      if (!prof) return;
      setLoading(true);
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
          body: JSON.stringify({ profile: { ...prof, language } }),
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
      <div className="max-w-2xl mx-auto px-4 py-6">
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
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        <LoadingSkeleton type="plan" />
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const members = effectiveProfile?.members || [];

  // Ranked actions for dynamic receipt lookup
  const rankedActions = effectiveProfile
    ? rankActions(effectiveProfile, hourlyAir || undefined)
    : [];
  const top3Ranked = rankedActions.slice(0, 3);

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

  const hasCoalOrWoodHeating = Boolean(
    effectiveProfile?.home.heating.some((h) =>
      ['coal_charcoal', 'wood'].includes(h)
    )
  );

  const asthmaticMembers =
    effectiveProfile?.members.filter((m) => m.conditions.includes('asthma')) || [];
  const hasAsthmaticMember = asthmaticMembers.length > 0;

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

  const formattedGeneratedAt = plan.generatedAt
    ? new Date(plan.generatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '08:30 AM';

  // Severity chip configuration
  const getSeverityChipMeta = (tier: string) => {
    const lower = tier.toLowerCase();
    if (
      lower.includes('hazard') ||
      lower.includes('severe') ||
      lower.includes('emergency')
    ) {
      return {
        label: 'Severe Hazard — protect lungs now',
        chipClass:
          'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800',
        dotClass: 'bg-rose-600',
      };
    }
    if (
      lower.includes('very poor') ||
      lower.includes('very unhealthy') ||
      lower.includes('very-unhealthy')
    ) {
      return {
        label: 'Very Unhealthy — take action now',
        chipClass:
          'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-800',
        dotClass: 'bg-purple-600',
      };
    }
    if (lower.includes('poor') || lower.includes('unhealthy')) {
      return {
        label: 'Unhealthy — wear masks & run purifiers',
        chipClass:
          'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/80 dark:text-orange-200 dark:border-orange-800',
        dotClass: 'bg-orange-600',
      };
    }
    if (lower.includes('moderate')) {
      return {
        label: 'Moderate — sensitive members take care',
        chipClass:
          'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800',
        dotClass: 'bg-amber-600',
      };
    }
    return {
      label: 'Good Air — safe outdoors',
      chipClass:
        'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800',
      dotClass: 'bg-emerald-600',
    };
  };

  const severityMeta = getSeverityChipMeta(plan.severityTier);

  // Selected member guidance if any
  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedMemberTips =
    plan.perMember.find((pm) => pm.memberId === selectedMemberId)?.tips || [];

  // WhatsApp share message
  const ventWindowStr =
    bestWindowsFormatted.length > 0
      ? `${bestWindowsFormatted[0].start}:00 – ${bestWindowsFormatted[0].end}:00`
      : '13:00 – 15:00';

  const topActionsSummary = top3Ranked
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.action.title} (${item.receipt.breathe.deltaPct}% exposure)`
    )
    .join('\n');

  const summaryText = `🌬️ Saans Family Air Plan
Tomorrow's Forecast: ${plan.severityTier}

Top 3 Actions:
${
  topActionsSummary ||
  '1. Run air purifier\n2. Wear N95 outdoors\n3. Keep windows shut'
}

Best Ventilation Window:
${ventWindowStr} (15m cross-flush)

Tailored for ${effectiveProfile?.location.placeName || 'Family'} · Saans
https://saans.local`;

  const handleCopyShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summaryText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = summaryText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      alert('Plan copied to clipboard!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Offline Status Notice */}
      <OfflineBanner lastUpdated={formattedGeneratedAt} />

      {/* 1. Header Section */}
      <header className="space-y-3">
        {/* Severity Chip */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${severityMeta.chipClass}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${severityMeta.dotClass} animate-pulse`}
            />
            <span>{severityMeta.label}</span>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            {effectiveProfile?.location.placeName || 'Delhi NCR'}
          </span>
        </div>

        {/* Title & Plain-Language Sentence */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {t('plan.title') || "Tomorrow's Air Plan"}
        </h1>

        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t('plan.subtitle') || "Here's your plan for tomorrow, tailored for your family."}
        </p>

        {/* Member Filter Chips */}
        {members.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              {t('plan.filter_timeline') || 'Filter timeline by family member:'}
            </div>
            <div
              role="tablist"
              aria-label="Filter timeline by member"
              className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-hide"
            >
              <button
                type="button"
                onClick={() => setSelectedMemberId('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
                  selectedMemberId === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {t('plan.all_family', { count: members.length }) || `All Family (${members.length})`}
              </button>
              {members.map((member) => {
                const isSelected = selectedMemberId === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center font-bold">
                      {member.nickname.charAt(0).toUpperCase()}
                    </span>
                    <span>{member.nickname}</span>
                    {member.conditions.includes('asthma') && (
                      <span title="Asthma">🫁</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Member Guidance Note */}
            {selectedMember && selectedMemberTips.length > 0 && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {t('plan.focus_for', { name: selectedMember.nickname }) || `Focus for ${selectedMember.nickname}:`}
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                  {selectedMemberTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 2. Day Timeline */}
      <section className="space-y-2">
        <DayTimeline
          timeline={timelineWithAir}
          bestWindows={bestWindowsFormatted}
          members={members}
          selectedMemberId={selectedMemberId}
        />
      </section>

      {/* 3. Top 3 Priority Receipts */}
      <section className="space-y-3 pt-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>📋</span>
            <span>
              {t('plan.top_actions') || 'Top 3 Priority Interventions'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('plan.top_actions_sub') || 'Ranked by calculated personal exposure averted for your household'}
          </p>
        </div>

        <div className="space-y-4">
          {top3Ranked.map((item) => (
            <ImpactReceipt
              key={item.receipt.id}
              receipt={item.receipt}
              members={members}
              actionTitle={t('actions.' + item.action.id + '.title') || item.action.title}
            />
          ))}
        </div>
      </section>

      {/* 4. Safety Notes Card (Compact) */}
      {(hasCoalOrWoodHeating ||
        hasAsthmaticMember ||
        (plan.safetyNotes && plan.safetyNotes.length > 0)) && (
        <section
          role="region"
          aria-label="Safety Directives"
          className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 sm:p-5 space-y-3 shadow-2xs"
        >
          <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {t('plan.safety_title') || 'Important Safety Directives'}
            </span>
          </div>

          <div className="space-y-2 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            {/* CO Warning if coal/wood heating detected */}
            {hasCoalOrWoodHeating && (
              <div className="flex items-start gap-2">
                <span className="font-bold shrink-0">⚠️ CO Hazard:</span>
                <span>
                  {t('plan.co_warning') ||
                    'Coal/wood heating generates toxic Carbon Monoxide (CO). Never completely seal rooms while combustion heaters are active. Keep a window cracked at least 2 inches to guarantee fresh air exchange.'}
                </span>
              </div>
            )}

            {/* Asthma Alert if asthmatic member */}
            {hasAsthmaticMember && (
              <div className="flex items-start gap-2">
                <span className="font-bold shrink-0">🫁 Asthma Alert:</span>
                <span>
                  {t('plan.asthma_alert', {
                    names: asthmaticMembers.map((m) => m.nickname).join(', '),
                  }) ||
                    `${asthmaticMembers.map((m) => m.nickname).join(', ')} ${
                      asthmaticMembers.length > 1 ? 'have' : 'has'
                    } asthma. Keep rescue inhalers within reach, run bedroom purifier continuously, and avoid outdoor physical activity during morning and evening smog peaks.`}
                </span>
              </div>
            )}

            {/* General notes from plan if any */}
            {plan.safetyNotes
              ?.filter(
                (note) =>
                  !note.toLowerCase().includes('carbon monoxide') &&
                  !note.toLowerCase().includes('asthma')
              )
              .slice(0, 2)
              .map((note, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-bold shrink-0">•</span>
                  <span>{note}</span>
                </div>
              ))}
          </div>

          <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 italic pt-1 border-t border-amber-200 dark:border-amber-800/60">
            {t('plan.medical_disclaimer') ||
              'Not medical advice. In case of respiratory distress or emergency, call 112 immediately.'}
          </p>
        </section>
      )}

      {/* 5. Scientific Citations & Bibliography */}
      {plan.citations && plan.citations.length > 0 && (
        <footer className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2 text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span>📚</span>
            <span>{t('plan.citations_title') || 'Scientific Evidence & Guidelines'}</span>
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

      {/* 6. Bottom WhatsApp Share Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="w-full min-h-[48px] py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>
            {t('plan.share_whatsapp') || 'Share Plan via WhatsApp'}
          </span>
        </button>
      </div>

      {/* WhatsApp Share Modal / Sheet */}
      {showShareModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[90dvh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {t('plan.share_modal_title') || 'Share Family Plan'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t('plan.share_modal_desc') ||
                "Share tomorrow's tailored air protection schedule with your family WhatsApp group or caregivers."}
            </p>

            {/* Message Preview Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono whitespace-pre-line text-slate-800 dark:text-slate-200 leading-relaxed select-all">
              {summaryText}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyShare}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedShare ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>
                  {copiedShare
                    ? (t('plan.copied') || 'Copied to Clipboard!')
                    : (t('plan.copy_text') || 'Copy Text')}
                </span>
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(summaryText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-colors text-center"
              >
                <Share2 className="w-4 h-4" />
                <span>{t('plan.open_whatsapp') || 'Open WhatsApp'}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
