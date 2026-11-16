'use client';

import React, { useState } from 'react';
import { Receipt, Member } from '@/lib/schemas';
import { EvidenceBadge } from './EvidenceBadge';
import { AssumptionsDrawer } from './AssumptionsDrawer';
import actionsData from '@/data/actions.json';

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

  // Look up action metadata from actions.json
  const actionMeta = actionsData.find((a) => a.id === receipt.actionId);
  const title =
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

  const handleToggleDone = () => {
    const next = !done;
    setDone(next);
    if (onMarkDone) {
      onMarkDone();
    }
  };

  // Generate plain-language equivalent for Give ledger
  const getGiveEquivalent = () => {
    const pm25 = receipt.give?.pm25_g ?? 0;
    const co2e = receipt.give?.co2e_g ?? 0;
    const nox = receipt.give?.nox_g ?? 0;

    if (pm25 > 0) {
      if (pm25 >= 100) {
        return `Avoids ~${pm25}g PM2.5 — equivalent to taking ~4 diesel cars off city roads today`;
      }
      if (pm25 >= 20) {
        return `Avoids ~${pm25}g PM2.5 — equivalent to removing a two-wheeler from the road for a day`;
      }
      return `Avoids ~${pm25}g PM2.5 — equal to stopping ~15 km of vehicle tailpipe smoke`;
    }

    if (co2e > 0) {
      return `Avoids ~${co2e}g CO₂e — like saving ${(co2e / 120).toFixed(1)} km of city car driving`;
    }

    if (nox > 0) {
      return `Avoids ~${nox}g NOx toxic combustion gas emissions`;
    }

    return 'Clean lifestyle shield — prevents personal respiratory deposition without adding secondary pollution';
  };

  // WHO guideline threshold is 15 µg/m³
  const whoLimit = 15;
  const afterExposure = receipt.breathe.after;
  const whoRatio = Math.max(1, Math.round((afterExposure / whoLimit) * 10) / 10);

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

  // Confidence styling
  const confidenceConfig = {
    low: {
      label: 'Low Confidence',
      badge:
        'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
    medium: {
      label: 'Medium Confidence',
      badge:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    },
    high: {
      label: 'High Confidence',
      badge:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
  }[receipt.confidence];

  return (
    <article
      className={`relative rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 ${
        done
          ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs'
          : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
      } p-4 sm:p-5 space-y-4 ${className}`}
    >
      {/* Top Header: Title & Evidence Grade */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {title}
            </h3>
            {done && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                ✓ Done
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>Target:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {memberNames}
            </span>
            {receipt.window && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-medium text-[11px]">
                ⏰ {receipt.window.start}:00 – {receipt.window.end}:00
              </span>
            )}
          </p>
        </div>

        <EvidenceBadge
          grade={receipt.evidence}
          why={actionMeta?.evidenceWhy}
        />
      </div>

      {/* DUAL LEDGER ROW: BREATHE (Personal Exposure) */}
      <div className="rounded-xl p-3 sm:p-3.5 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
            <span>🫁</span>
            <span>What you BREATHE (Exposure Estimate*)</span>
          </span>
          <span className="font-extrabold text-sky-700 dark:text-sky-300">
            {receipt.breathe.deltaPct > 0 ? `+${receipt.breathe.deltaPct}%` : `${receipt.breathe.deltaPct}%`}
          </span>
        </div>

        {/* Before -> After Meter */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <div className="text-slate-500 dark:text-slate-400">
            Before:{' '}
            <span className="line-through font-semibold text-slate-700 dark:text-slate-300">
              {receipt.breathe.before} {receipt.breathe.unit}
            </span>
          </div>
          <div className="text-sky-800 dark:text-sky-200 font-bold">
            After:{' '}
            <span className="text-sm font-black text-sky-600 dark:text-sky-400">
              {receipt.breathe.after} {receipt.breathe.unit}
            </span>
          </div>
        </div>

        {/* Mini WHO Guideline Bar */}
        <div className="space-y-1">
          <div className="relative w-full h-2.5 rounded-full bg-sky-200/70 dark:bg-sky-900/60 overflow-hidden">
            {/* Safe WHO limit indicator */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-emerald-500 rounded-l-full"
              style={{ width: `${Math.min(100, (whoLimit / (receipt.breathe.before || 100)) * 100)}%` }}
              title="WHO 24h Guideline: 15 µg/m³"
            />
            {/* Projected exposure level after action */}
            <div
              className="absolute top-0 bottom-0 bg-sky-600 dark:bg-sky-400 rounded-full opacity-90 transition-all duration-300"
              style={{ width: `${Math.min(100, (receipt.breathe.after / (receipt.breathe.before || 100)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              ● WHO safe target: 15 µg/m³
            </span>
            <span className="font-medium">
              After action: ~{whoRatio}× WHO guideline
            </span>
          </div>
        </div>
      </div>

      {/* DUAL LEDGER ROW: GIVE (Emissions Avoided) */}
      <div className="rounded-xl p-3 sm:p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
            <span>🌱</span>
            <span>What you GIVE to the Air (Emissions Avoided*)</span>
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            {receipt.give.period || 'daily'}
          </span>
        </div>
        <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
          {getGiveEquivalent()}
        </p>
      </div>

      {/* METADATA PILLS: Cost, Effort, Confidence */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Cost Pill */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
            <span>🏷️</span>
            <span>{formatCost()}</span>
          </span>

          {/* Effort Pill */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
            <span>⚡ Effort:</span>
            {renderEffortDots(receipt.effort)}
          </span>

          {/* Confidence Badge */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${confidenceConfig.badge}`}
          >
            {confidenceConfig.label}
          </span>
        </div>

        {/* Mark Done CTA Button (Accessible 44px tap target) */}
        <button
          type="button"
          onClick={handleToggleDone}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 ${
            done
              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 dark:text-emerald-200'
              : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-xs'
          }`}
          aria-pressed={done}
        >
          <span>{done ? '✓ Completed' : '✓ Mark done'}</span>
        </button>
      </div>

      {/* Expandable Assumptions & Scientific Sources */}
      <AssumptionsDrawer assumptions={receipt.assumptions} />

      {/* Required Scientific Estimate Label */}
      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center italic">
        *All numbers are physics-based model estimates with uncertainty ranges. Not medical advice.
      </div>
    </article>
  );
}

export default ImpactReceipt;
