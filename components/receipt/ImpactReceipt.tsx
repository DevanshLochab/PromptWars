'use client';

import React, { useState } from 'react';
import { Receipt, Member } from '@/lib/schemas';
import { EvidenceBadge } from './EvidenceBadge';
import { AssumptionsDrawer } from './AssumptionsDrawer';
import actionsData from '@/data/actions.json';
import { CheckCircle, Zap, Clock, Coins, ChevronDown } from 'lucide-react';

export interface ImpactReceiptProps {
  receipt: Receipt;
  members?: Member[];
  onMarkDone?: () => void;
  isDone?: boolean;
  actionTitle?: string;
  className?: string;
}

export function ImpactReceipt({
  receipt,
  members = [],
  onMarkDone,
  isDone: initialDone = false,
  actionTitle,
  className = '',
}: ImpactReceiptProps) {
  const [done, setDone] = useState(initialDone);
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Look up action metadata from actions.json
  const actionMeta = actionsData.find((a) => a.id === receipt.actionId);
  const baseTitle =
    actionTitle ||
    actionMeta?.title ||
    receipt.actionId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Determine who benefits
  const memberNames =
    receipt.memberIds && receipt.memberIds.length > 0
      ? receipt.memberIds
          .map((id) => {
            const m = members.find((mem) => mem.id === id);
            return m ? m.nickname : id;
          })
          .join(', ')
      : actionMeta?.whoBenefits || 'All Household Members';

  const primaryMember = members.find((m) => receipt.memberIds?.includes(m.id));
  const primaryName = primaryMember ? primaryMember.nickname.split(' ')[0] : memberNames.split(',')[0].split(' ')[0];
  const avatarInitial = primaryName ? primaryName.charAt(0).toUpperCase() : 'F';

  // Reduction percentage for plain-sentence headline
  const deltaPct = Math.abs(Math.round(receipt.breathe.deltaPct || 0));

  // Headline: plain sentence ("Run your purifier on high tonight — Aarav breathes 84% cleaner air.")
  const headline =
    deltaPct > 0
      ? `${baseTitle.replace(/[\.\-—]\s*$/, '')} — ${primaryName} breathes ${deltaPct}% cleaner air.`
      : `${baseTitle.replace(/[\.\-—]\s*$/, '')} — protects ${primaryName} from high pollution.`;

  const handleToggleDone = () => {
    const next = !done;
    setDone(next);
    if (onMarkDone) {
      onMarkDone();
    }
  };

  // Plain-language give-back line
  const getGiveBackLine = () => {
    const pm25 = receipt.give?.pm25_g ?? 0;
    const co2e = receipt.give?.co2e_g ?? 0;

    if (co2e > 0) {
      const kg = (co2e / 1000).toFixed(1);
      return `Saves ~${kg} kg CO₂e this week`;
    }
    if (pm25 > 0) {
      return `Avoids ~${pm25}g PM2.5 — keeps air cleaner for your block this week`;
    }
    return `Saves ~0.8 kg CO₂e this week with energy-efficient filtration`;
  };

  // WHO guideline threshold is 15 µg/m³
  const whoLimit = 15;
  const afterExposure = receipt.breathe.after;
  const whoRatio = Math.max(1, Math.round((afterExposure / whoLimit) * 10) / 10);

  // Geometry for horizontal bars
  const maxVal = Math.max(receipt.breathe.before, 100);
  const withoutPct = Math.min(100, Math.max(12, (receipt.breathe.before / maxVal) * 100));
  const withPct = Math.min(100, Math.max(8, (receipt.breathe.after / maxVal) * 100));
  const whoTickPct = Math.min(100, Math.max(4, (whoLimit / maxVal) * 100));

  // Format cost
  const formatCost = () => {
    const upfront = receipt.cost.upfront;
    const ongoing = receipt.cost.ongoing;
    const curr = receipt.cost.currency === 'INR' ? '₹' : receipt.cost.currency;

    if (upfront === 0 && ongoing === 0) return 'Free';
    if (upfront > 0 && ongoing === 0) return `${curr}${upfront} one-time`;
    if (upfront === 0 && ongoing > 0) return `${curr}${ongoing}/mo`;
    return `${curr}${upfront} + ${curr}${ongoing}/mo`;
  };

  // Effort dots (1-5)
  const renderEffortDots = (score: number) => {
    return (
      <div
        className="inline-flex items-center gap-1 select-none"
        aria-label={`Effort: ${score} out of 5`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < score ? 'bg-slate-700 dark:bg-slate-300' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <article
      className={`w-full rounded-[var(--radius-card)] border transition-all duration-200 bg-[var(--surface)] ${
        done
          ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/15 dark:bg-emerald-950/10'
          : 'border-[var(--border)] shadow-xs'
      } p-4 sm:p-5 space-y-4 ${className}`}
    >
      {/* 1. Headline: Plain sentence */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-[var(--text)] tracking-tight leading-snug">
              {headline}
            </h3>
            {done && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                <CheckCircle className="w-3 h-3" />
                Done
              </span>
            )}
          </div>
        </div>

        <EvidenceBadge
          grade={receipt.evidence}
          why={actionMeta?.evidenceWhy}
        />
      </div>

      {/* 2. Visual: Two horizontal bars labeled "Without" and "With" + vertical tick at WHO 15 µg/m³; big "× WHO guideline" number; µg/m³ small */}
      <div className="rounded-xl p-3 sm:p-4 bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
            What you BREATHE
          </span>
          <span className="text-xl sm:text-2xl font-black text-[var(--text)]">
            ~{whoRatio}× WHO guideline
          </span>
        </div>

        {/* Dual Bars Visualization */}
        <div className="space-y-2 relative pt-2">
          {/* Vertical WHO 15 µg/m³ tick */}
          <div
            className="absolute top-0 bottom-0 z-10 flex flex-col items-center pointer-events-none"
            style={{ left: `${whoTickPct}%` }}
          >
            <div className="h-full border-r-2 border-dashed border-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap -mt-1 bg-white dark:bg-slate-900 px-1 rounded-sm shadow-2xs">
              WHO 15
            </span>
          </div>

          {/* "Without" Bar */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Without</span>
              <span className="text-[11px] font-medium">{receipt.breathe.before} µg/m³</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-rose-500/80 dark:bg-rose-600/80 rounded-full"
                style={{ width: `${withoutPct}%` }}
              />
            </div>
          </div>

          {/* "With" Bar */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">With</span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{receipt.breathe.after} µg/m³</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-[var(--success)] rounded-full transition-all duration-500"
                style={{ width: `${withPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Give-back line: lucide icon + "saves X kg CO₂e this week" or similar */}
      <div className="rounded-xl p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">
          <span>What you GIVE to the Air</span>
          <span>{receipt.give.period || 'weekly'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-950 dark:text-emerald-200 font-medium">
          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{getGiveBackLine()}</span>
        </div>
      </div>

      {/* 4. Chip row: for whom (avatar initial chip), when, cost (₹), effort (1-5 dots), evidence badge */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        {/* For Whom chip */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text)] font-semibold border border-[var(--border)]">
          <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-[var(--on-primary)] text-[10px] font-bold flex items-center justify-center shrink-0">
            {avatarInitial}
          </span>
          <span>{memberNames}</span>
        </span>

        {/* When chip */}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text)] font-semibold border border-[var(--border)]">
          <Clock className="w-3.5 h-3.5 text-[var(--muted)]" />
          <span>{receipt.window ? `${receipt.window.start}:00–${receipt.window.end}:00` : 'Tonight'}</span>
        </span>

        {/* Cost chip */}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text)] font-semibold border border-[var(--border)]">
          <Coins className="w-3.5 h-3.5 text-[var(--muted)]" />
          <span>{formatCost()}</span>
        </span>

        {/* Effort chip */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text)] font-semibold border border-[var(--border)]">
          <span className="text-[var(--muted)]">Effort:</span>
          {renderEffortDots(receipt.effort)}
        </span>
      </div>

      {/* 5. "Add to my plan" button with checkmark state & "How we calculated ↓" link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[var(--border)]/70">
        <button
          type="button"
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--text)] font-semibold transition-colors cursor-pointer self-start sm:self-center"
        >
          <span>How we calculated</span>
          <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${showAssumptions ? 'rotate-180' : ''}`} />
        </button>

        <button
          type="button"
          onClick={handleToggleDone}
          className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)] ${
            done
              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-200'
              : 'bg-[var(--primary)] hover:opacity-90 text-[var(--on-primary)] shadow-xs'
          }`}
          aria-pressed={done}
        >
          {done ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              <span>In your plan</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Add to my plan</span>
            </>
          )}
          <span className="sr-only">Mark done</span>
        </button>
      </div>

      {/* Expandable Assumptions */}
      {showAssumptions && (
        <AssumptionsDrawer assumptions={receipt.assumptions} defaultOpen={true} />
      )}
    </article>
  );
}

export default ImpactReceipt;
