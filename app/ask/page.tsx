'use client';

import React, { useState } from 'react';
import { AskChat } from '@/components/ask/AskChat';
import { MythCheckCard, MythCheckItem } from '@/components/ask/MythCheckCard';
import { useTranslation } from '@/lib/i18n';
import { WhatsAppSummary } from '@/components/common/WhatsAppSummary';

const FEATURED_MYTHS: MythCheckItem[] = [
  {
    claim: 'Keeping 3 snake plants in the bedroom removes 90% of winter smog particles.',
    evidenceSays:
      'Field studies and EPA reviews confirm that houseplants remove zero fine particulate matter (PM2.5). In real homes with standard 0.5 ACH ventilation, you would need over 100 plants per square meter to match a basic HEPA purifier CADR.',
    whatToDoInstead:
      'Use a mechanical HEPA purifier or build a DIY Corsi-Rosenthal box fan air cleaner with MERV-13 filters.',
    citations: [
      { title: 'Waring et al. (Nature J Exp Sci 2020)', url: 'https://www.nature.com/articles/s41370-019-0175-9' },
      { title: 'EPA IAQ Plants Guide', url: 'https://www.epa.gov' },
    ],
  },
  {
    claim: 'Eating a spoonful of jaggery (gur) after coming home cleans smog from your lungs.',
    evidenceSays:
      'Fine PM2.5 penetrates into pulmonary alveoli and enters the bloodstream. Ingested jaggery enters the stomach/digestive system with no physiological pathway to reach or clear lung alveoli. Jaggery provides calories and trace iron, but zero respiratory particulate detox.',
    whatToDoInstead:
      'Wear a sealed N95/FFP2 respirator during outdoor transit and keep bedroom windows sealed during peak smog hours.',
    citations: [
      { title: 'WHO Air Pollution Health Guidance', url: 'https://www.who.int' },
    ],
  },
];

export default function AskPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'chat' | 'myths'>('chat');

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      {/* Page Title & Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {t('ask.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('ask.subtitle')}
          </p>
        </div>
        <WhatsAppSummary />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          💬 AI Air Coach Chat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('myths')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'myths'
              ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          🚫 Common Myths Debunked
        </button>
      </div>

      {/* Main View */}
      {activeTab === 'chat' ? (
        <div className="animate-in fade-in duration-200">
          <AskChat />
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Evidence-Based Myth Verification:
            </span>{' '}
            During severe pollution crises, unproven folk remedies circulate widely on social media,
            diverting families from effective protections like HEPA purifiers and N95 respirators.
          </div>

          <div className="space-y-4">
            {FEATURED_MYTHS.map((myth, idx) => (
              <MythCheckCard key={idx} item={myth} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
