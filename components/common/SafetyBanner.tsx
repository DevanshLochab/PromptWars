'use client';

import React from 'react';

export type SafetyBannerType =
  | 'co_warning'
  | 'breathing_difficulty'
  | 'medical'
  | 'not_medical_advice';

export interface SafetyBannerProps {
  type: SafetyBannerType;
  message?: string;
  className?: string;
}

export function SafetyBanner({ type, message, className = '' }: SafetyBannerProps) {
  if (type === 'co_warning') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`p-4 rounded-xl border border-red-500/50 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 shadow-sm flex items-start gap-3 ${className}`}
      >
        <span className="text-2xl select-none" aria-hidden="true">
          ⚠️
        </span>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide text-red-700 dark:text-red-300 uppercase">
              Carbon Monoxide Hazard Warning
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100">
              Safety Critical
            </span>
          </div>
          <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed font-medium">
            {message ||
              'Combustion heating or open flames without flue ventilation can produce lethal, odorless carbon monoxide (CO). Never seal a room containing an unvented fuel-burning heater. Maintain ventilation or install an audible CO detector.'}
          </p>
        </div>
      </div>
    );
  }

  if (type === 'breathing_difficulty') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`p-4 rounded-xl border border-rose-500/60 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 shadow-sm flex items-start gap-3 ${className}`}
      >
        <span className="text-2xl select-none" aria-hidden="true">
          🏥
        </span>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-rose-700 dark:text-rose-300">
              Severe Respiratory Distress Alert
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100">
              Seek Care
            </span>
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
            {message ||
              'If anyone experiences wheezing, chest tightness, or shortness of breath that does not respond to prescribed relief inhalers, seek immediate emergency medical care.'}
          </p>
          <div className="pt-1">
            <a
              href="tel:112"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs min-h-[44px]"
            >
              <span>📞</span> Call Emergency Services (112)
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'medical') {
    return (
      <div
        role="note"
        className={`p-3 rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 ${className}`}
      >
        <span className="text-lg select-none" aria-hidden="true">
          ⚕️
        </span>
        <div className="space-y-0.5 flex-1 leading-relaxed">
          <span className="font-semibold text-amber-800 dark:text-amber-300">
            Health Management Notice:
          </span>{' '}
          {message ||
            'Keep quick-relief respiratory medications readily accessible. Monitor sensitive members (children, seniors, asthma patients) closely.'}
        </div>
      </div>
    );
  }

  // 'not_medical_advice' default disclaimer banner
  return (
    <footer
      role="note"
      className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-xs leading-relaxed flex items-start gap-2.5 ${className}`}
    >
      <span className="text-base select-none" aria-hidden="true">
        ℹ️
      </span>
      <div>
        <strong className="text-slate-700 dark:text-slate-300">Not Medical Advice.</strong>{' '}
        {message ||
          'Saans calculates air exposure reductions and community emission estimates using peer-reviewed environmental models (WHO, EPA, CPCB). It does not diagnose, treat, or replace professional clinical judgment.'}
      </div>
    </footer>
  );
}

export default SafetyBanner;
