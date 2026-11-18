'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export interface WhatsAppPlanData {
  date?: string;
  aqi?: number;
  aqiBand?: string;
  topActions?: Array<{
    title: string;
    impact: string;
  }>;
  bestVentilationWindow?: string;
}

interface WhatsAppSummaryProps {
  planData?: WhatsAppPlanData;
  className?: string;
}

export function WhatsAppSummary({ planData, className = '' }: WhatsAppSummaryProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [dateStr, setDateStr] = useState(planData?.date || 'Today');

  useEffect(() => {
    if (!planData?.date) {
      setDateStr(
        new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    }
  }, [planData?.date]);
  const aqiVal = planData?.aqi ?? 360;
  const aqiBand = planData?.aqiBand || 'Severe (गंभीर)';
  const bestWindow = planData?.bestVentilationWindow || '13:00 - 15:00';
  const actions = planData?.topActions && planData.topActions.length > 0
    ? planData.topActions
    : [
        {
          title: 'Run bedroom purifier on high 30m before sleep',
          impact: '-35% overnight PM2.5 exposure',
        },
        {
          title: 'Run kitchen exhaust fan during & 15m after cooking',
          impact: '-40% fine cooking aerosol plume',
        },
        {
          title: 'Take Metro instead of cab for daily commute',
          impact: 'Avoid 55g tailpipe PM2.5 & NOx',
        },
      ];

  const generateSummaryText = (): string => {
    const actionLines = actions
      .slice(0, 3)
      .map((a, idx) => `${idx + 1}. ${a.title} - ${a.impact}`)
      .join('\n');

    return `🌬️ Saans Air Plan - ${dateStr}
AQI: ${aqiVal} (${aqiBand})

Top actions:
${actionLines}

Best window: ${bestWindow} for fresh air
Stay safe! 💨
${typeof window !== 'undefined' ? window.location.origin : 'https://saans.app'}`;
  };

  const handleCopy = async () => {
    const text = generateSummaryText();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback alert
      alert('Plan copied to clipboard!');
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleCopy}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all ${
          copied
            ? 'bg-emerald-600 text-white dark:bg-emerald-500'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/60'
        }`}
        aria-label="Copy WhatsApp Summary"
      >
        <span className="text-sm">💬</span>
        <span>
          {copied ? t('whatsapp.copied') : t('whatsapp.button_label')}
        </span>
      </button>
    </div>
  );
}
