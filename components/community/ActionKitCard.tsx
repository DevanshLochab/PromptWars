'use client';

import React, { useState } from 'react';
import { ActionKit } from '@/lib/store/communityStore';
import { useTranslation } from '@/lib/i18n';

interface ActionKitCardProps {
  kit: ActionKit;
}

export function ActionKitCard({ kit }: ActionKitCardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'rwa' | 'school' | 'whatsapp'>('rwa');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs space-y-4 transition-all">
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            {kit.issueLabel}
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {kit.title}
          </h3>
        </div>
        <span className="self-start sm:self-auto text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          Cooperative Solution
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        {kit.description}
      </p>

      {/* Practical Alternatives */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-2 border border-slate-150 dark:border-slate-800">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <span>💡</span>
          <span>{t('actionkit.alternatives')}</span>
        </div>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pl-4 list-disc marker:text-sky-500">
          {kit.practicalAlternatives.map((alt, idx) => (
            <li key={idx} className="leading-normal">{alt}</li>
          ))}
        </ul>
      </div>

      {/* What Changes Stats */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 text-xs text-sky-900 dark:text-sky-200">
        <span className="text-base">📊</span>
        <div>
          <span className="font-bold">{t('actionkit.what_changes')} </span>
          <span>{kit.whatChangesStats}</span>
        </div>
      </div>

      {/* Notice Switcher & Generator */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('rwa')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all ${
              activeTab === 'rwa'
                ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🏢 Building/RWA Notice
          </button>
          {kit.schoolNotice && (
            <button
              type="button"
              onClick={() => setActiveTab('school')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all ${
                activeTab === 'school'
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🏫 School Circular
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            💬 WhatsApp Message
          </button>
        </div>

        {/* Notice Preview Box */}
        <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-sans text-xs text-slate-800 dark:text-slate-200">
          <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed max-h-48 overflow-y-auto">
            {activeTab === 'rwa' && kit.buildingNotice}
            {activeTab === 'school' && kit.schoolNotice}
            {activeTab === 'whatsapp' && kit.whatsAppMessage}
          </pre>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const targetText =
                  activeTab === 'rwa'
                    ? kit.buildingNotice
                    : activeTab === 'school'
                    ? kit.schoolNotice || ''
                    : kit.whatsAppMessage;
                copyToClipboard(targetText, activeTab);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-xs"
            >
              <span>{copiedType === activeTab ? '✓' : '📋'}</span>
              <span>
                {copiedType === activeTab
                  ? t('actionkit.copied')
                  : activeTab === 'rwa'
                  ? t('actionkit.copy_rwa_notice')
                  : activeTab === 'school'
                  ? t('actionkit.copy_school_notice')
                  : t('actionkit.copy_whatsapp')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
