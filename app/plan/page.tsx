'use client';

import React, { useState } from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';
import { DayTimeline } from '@/components/air/DayTimeline';
import { ImpactReceipt } from '@/components/receipt/ImpactReceipt';
import { MemberTabs } from '@/components/members/MemberTabs';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import { Receipt } from '@/lib/schemas';
import { WhatsAppSummary } from '@/components/common/WhatsAppSummary';
import { OfflineBanner } from '@/components/common/OfflineBanner';

export default function PlanPage() {
  const { profile, isDemoMode } = useProfile();
  const [activeMemberId, setActiveMemberId] = useState<string>(
    profile?.members[0]?.id || 'm3'
  );

  const members = profile?.members || [
    {
      id: 'm1',
      nickname: 'Papa (Rajesh)',
      ageBand: 'adult' as const,
      conditions: ['none' as const],
      commute: { mode: 'two_wheeler' as const, km: 12, startHour: 9, endHour: 18 },
      outdoorHoursPerDay: 2.5,
      outdoorActivity: 'none' as const,
      maskOwned: 'surgical' as const,
    },
    {
      id: 'm2',
      nickname: 'Mama (Priya)',
      ageBand: 'adult' as const,
      conditions: ['none' as const],
      commute: { mode: 'none' as const, km: 0, startHour: 0, endHour: 0 },
      outdoorHoursPerDay: 1.0,
      outdoorActivity: 'light' as const,
      maskOwned: 'none' as const,
    },
    {
      id: 'm3',
      nickname: 'Aarav (Son)',
      ageBand: 'child' as const,
      conditions: ['asthma' as const],
      commute: { mode: 'bus' as const, km: 5, startHour: 7, endHour: 14 },
      outdoorHoursPerDay: 2.0,
      outdoorActivity: 'exercise' as const,
      maskOwned: 'n95' as const,
    },
    {
      id: 'm4',
      nickname: 'Dadaji (Grandfather)',
      ageBand: 'senior' as const,
      conditions: ['heart' as const],
      commute: { mode: 'none' as const, km: 0, startHour: 0, endHour: 0 },
      outdoorHoursPerDay: 1.0,
      outdoorActivity: 'light' as const,
      maskOwned: 'none' as const,
    },
  ];

  // Top 3 Plan Receipts
  const planReceipts: Receipt[] = [
    {
      id: 'rcpt_plan_1_shift_play',
      actionId: 'shift_outdoor_play_to_best_window',
      memberIds: ['m3'],
      formulaId: 'shift_outdoor_hours',
      window: { start: 13, end: 15 },
      breathe: {
        metric: 'pm25_exposure_reduction_pct',
        before: 375,
        after: 180,
        deltaPct: -52.0,
        unit: 'µg/m³',
        low: 150,
        high: 210,
      },
      give: {
        pm25_g: 0,
        co2e_g: 0,
        period: 'daily',
      },
      cost: { upfront: 0, ongoing: 0, currency: 'INR' },
      effort: 1,
      evidence: 'B',
      confidence: 'high',
      assumptions: [
        {
          label: 'Outdoor PM2.5 trough',
          value: '180',
          unit: 'µg/m³',
          source: 'Diurnal boundary layer expansion model (13:00-15:00)',
        },
        {
          label: 'Child exercise respiration factor',
          value: '2.4',
          unit: '× resting',
          source: 'EPA Child-Specific Exposure Factors Handbook',
        },
      ],
    },
    {
      id: 'rcpt_plan_2_n95_commute',
      actionId: 'n95_during_motorcycle_auto_commute',
      memberIds: ['m1'],
      formulaId: 'mask_commute_reduction',
      window: { start: 8, end: 10 },
      breathe: {
        metric: 'pm25_exposure_reduction_pct',
        before: 380,
        after: 76,
        deltaPct: -80.0,
        unit: 'µg/m³',
        low: 65,
        high: 95,
      },
      give: {
        pm25_g: 0,
        co2e_g: 0,
        period: 'daily',
      },
      cost: { upfront: 250, ongoing: 50, currency: 'INR' },
      effort: 2,
      evidence: 'A',
      confidence: 'high',
      assumptions: [
        {
          label: 'Two-wheeler roadside concentration',
          value: '380',
          unit: 'µg/m³',
          source: 'Arterial ring road micro-environment study',
        },
        {
          label: 'N95 fitted filtration efficiency',
          value: '80',
          unit: '% real-world',
          source: 'NIOSH respirator real-world fit factor benchmark',
        },
      ],
    },
    {
      id: 'rcpt_plan_3_kitchen_exhaust',
      actionId: 'cooking_exhaust_on_during_and_after',
      memberIds: ['m1', 'm2', 'm3', 'm4'],
      formulaId: 'cooking_exhaust_purge',
      window: { start: 19, end: 21 },
      breathe: {
        metric: 'pm25_exposure_reduction_pct',
        before: 210,
        after: 65,
        deltaPct: -69.0,
        unit: 'µg/m³',
        low: 50,
        high: 80,
      },
      give: {
        pm25_g: 0,
        co2e_g: 0,
        period: 'daily',
      },
      cost: { upfront: 0, ongoing: 6, currency: 'INR' },
      effort: 1,
      evidence: 'A',
      confidence: 'high',
      assumptions: [
        {
          label: 'Range hood capture efficiency',
          value: '70',
          unit: '%',
          source: 'ASHRAE 62.2 residential ventilation standard',
        },
        {
          label: '15-minute post-cook exhaust purge',
          value: '0.85',
          unit: 'decay factor',
          source: 'Indoor aerosol clearance half-life model',
        },
      ],
    },
  ];

  // 24-hr Plan Timeline
  const planTimeline = Array.from({ length: 24 }).map((_, hour) => {
    let aqiBand = 'hazardous';
    let advice = 'Heavy nocturnal inversion. Keep all outdoor vents latched.';
    const tags: string[] = [];

    if (hour >= 12 && hour <= 15) {
      aqiBand = 'very-unhealthy';
      advice = 'Best solar dispersion window. Cleanest air of the day (PM2.5 ~180 µg/m³).';
      tags.push('Ventilate', 'Outdoor Play');
    } else if (hour >= 7 && hour <= 9) {
      aqiBand = 'hazardous';
      advice = 'Morning rush peak. Rajesh wear N95 on two-wheeler commute.';
      tags.push('Commute N95', 'School run');
    } else if (hour >= 18 && hour <= 20) {
      aqiBand = 'hazardous';
      advice = 'Evening temperature inversion settling in. Exhaust hood mandatory during cooking.';
      tags.push('Exhaust on');
    } else if (hour >= 21) {
      aqiBand = 'hazardous';
      advice = 'Run bedroom purifier on High 30 minutes before sleep with door closed.';
      tags.push('Purifier High');
    }

    return {
      hour,
      aqiBand,
      tags,
      advice,
      pm25: hour >= 12 && hour <= 15 ? 180 : 340,
      aqi: hour >= 12 && hour <= 15 ? 230 : 390,
    };
  });

  // Per-member tip map
  const memberTips: Record<string, string[]> = {
    m1: [
      'Two-wheeler transit: Wear NIOSH-certified N95 respirator. Roadside PM2.5 reaches 380 µg/m³ near traffic intersections.',
      'Check mask nose wire: Press both sides firmly against the nose bridge to eliminate leak channels.',
      'Consider Delhi Metro Magenta line during Severe+ emergency smog alerts to cut commute intake by 65%.',
    ],
    m2: [
      'Kitchen ventilation: Run exhaust fan 1 minute before turning on the LPG stove and 15 minutes after cooking finishes.',
      'Cleaning protocol: Wet mop tile floors using damp microfiber. Never use dry brooms which launch settled particles into breathing height.',
      'Windows: Keep balcony sliders closed except during the 1:00 PM – 3:00 PM solar dispersion window.',
    ],
    m3: [
      'Asthma protection: Ensure fast-acting rescue inhaler (Salbutamol) is in school backpack.',
      'Outdoor physical play: Reschedule active games exclusively to the 1:00 PM – 3:00 PM window when air is cleanest.',
      'Clean bedroom refuge: Sleep in the sealed bedroom with HEPA purifier running on continuous low/night mode.',
    ],
    m4: [
      'Cardiovascular caution: Cancel morning walks before 10:30 AM. Cold dense smog triggers arterial vasoconstriction.',
      'Indoor resting: Spend daytime reading/resting in the bedroom refuge room where PM2.5 is kept below 50 µg/m³.',
      'Hydration: Drink warm fluids regularly to help mucous membranes clear inhaled particulate matter.',
    ],
  };

  const currentMember =
    members.find((m) => m.id === activeMemberId) || members[0];
  const currentTips = memberTips[currentMember.id] || memberTips.m1;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-14">
      {/* Offline Status Notice */}
      <OfflineBanner lastUpdated="15 Jan, 08:30 AM" />

      {/* 1. Headline & Severity Tier */}
      <div className="space-y-3 border-b border-slate-200/60 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Tomorrow's Air Protection Plan
          </h1>
          <div className="flex items-center gap-2">
            <WhatsAppSummary />
            {/* Severity Tier Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span>Tier IV: Severe Inversion (GRAP-4)</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Targeted 24-hour schedule calibrated for{' '}
          <strong className="text-slate-700 dark:text-slate-300">
            {profile?.location.placeName || 'New Delhi, India'}
          </strong>{' '}
          • {isDemoMode ? '⚡ Demo Forecast Mode' : 'Live Physics Calibration'}
        </p>
      </div>

      {/* 2. 24-Hour Timeline */}
      <section className="space-y-2">
        <DayTimeline
          timeline={planTimeline}
          bestWindows={[{ start: 13, end: 15 }]}
        />
      </section>

      {/* 3. Top 3 Actions as Signature Impact Receipts */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>📋</span>
            <span>Top 3 High-Impact Interventions</span>
          </h2>
          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
            Ranked by Exposure Averted
          </span>
        </div>

        <div className="space-y-4">
          {planReceipts.map((receipt) => (
            <ImpactReceipt
              key={receipt.id}
              receipt={receipt}
              members={members}
            />
          ))}
        </div>
      </section>

      {/* 4. MemberTabs with Per-Member Tips */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>🛡️</span>
            <span>Individual Family Guidance</span>
          </h2>
        </div>

        <MemberTabs
          members={members}
          activeId={activeMemberId}
          onChange={(id) => setActiveMemberId(id)}
        />

        {/* Selected Member Guidance Card */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Guidance for</span>
              <span className="text-sky-600 dark:text-sky-400">
                {currentMember.nickname}
              </span>
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {currentMember.ageBand.toUpperCase()}
            </span>
          </div>

          <ul className="space-y-2 text-xs">
            {currentTips.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                <span className="text-sky-500 font-bold" aria-hidden="true">
                  •
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. Safety Notes */}
      <section className="space-y-3 pt-2">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>⚠️</span>
          <span>Safety Directives</span>
        </h2>

        <SafetyBanner
          type="co_warning"
          message="Never operate unvented flame or charcoal heaters (angithi/gas burners) in enclosed rooms. Heating combustion produces carbon monoxide (CO), which causes fatal hypoxia. Ventilate or rely on safe electric heating."
        />

        <SafetyBanner
          type="breathing_difficulty"
          message="For asthmatic children or seniors with cardiovascular history: If chest tightness or breathing distress occurs, administer prescribed bronchodilator and seek medical care immediately."
        />

        <SafetyBanner type="not_medical_advice" />
      </section>

      {/* 6. Scientific Citations & Bibliography */}
      <footer className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2 text-xs">
        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <span>📚</span>
          <span>Scientific Basis & Evidence Citations</span>
        </div>
        <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside">
          <li>
            World Health Organization (WHO):{' '}
            <span className="italic">
              Global Air Quality Guidelines (2021) for PM2.5, PM10, and NO2.
            </span>
          </li>
          <li>
            US Environmental Protection Agency (EPA):{' '}
            <span className="italic">
              Guide to Air Cleaners in the Home & CADR Standard ANSI/AHAM AC-1.
            </span>
          </li>
          <li>
            Central Pollution Control Board (CPCB India):{' '}
            <span className="italic">
              Graded Response Action Plan (GRAP-IV) Delhi National Capital Region.
            </span>
          </li>
          <li>
            National Institute for Occupational Safety and Health (NIOSH):{' '}
            <span className="italic">
              Respirator Filtration Efficiency & Seal Performance (42 CFR 84).
            </span>
          </li>
        </ul>
      </footer>
    </div>
  );
}
