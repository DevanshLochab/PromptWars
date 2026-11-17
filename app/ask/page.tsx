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
    shortAnswer: 'Houseplants do not filter airborne PM2.5 soot or smoke particles in real homes.',
    verdict: 'myth',
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
      'Fine PM2.5 penetrates deep into pulmonary alveoli and enters the bloodstream. Ingested jaggery enters the stomach/digestive tract with no physiological pathway to reach or clear lung alveoli. Jaggery provides calories and trace iron, but zero respiratory particulate detox.',
    shortAnswer: 'Dietary intake goes to the stomach, whereas inhaled PM2.5 is trapped in lung alveoli.',
    verdict: 'myth',
    whatToDoInstead:
      'Wear a sealed N95/FFP2 respirator during outdoor transit and keep bedroom windows sealed during peak smog hours.',
    citations: [
      { title: 'WHO Air Pollution Health Guidance', url: 'https://www.who.int' },
      { title: 'American Lung Association: Inhaled Particulates', url: 'https://www.lung.org' },
    ],
  },
  {
    claim: 'Wearing a simple cloth handkerchief or bandana protects against 350+ AQI smog.',
    evidenceSays:
      'Cloth weave apertures (20–100 µm) are orders of magnitude larger than sub-micron PM2.5 soot (0.1–2.5 µm). Controlled NIOSH tests show cloth barriers filter less than 15–20% of particles and have massive peripheral seal leaks.',
    shortAnswer: 'Cloth masks lack electrostatic filtration media and leak contaminated air around edges.',
    verdict: 'myth',
    whatToDoInstead:
      'Use a certified NIOSH N95, EN149 FFP2, or BIS ISI 9473 rated cup- or bifold-style respirator with an airtight nose-clip seal.',
    citations: [
      { title: 'CDC/NIOSH Respirator Efficacy Studies', url: 'https://www.cdc.gov/niosh' },
    ],
  },
  {
    claim: 'Using an ozone generator or ionic air cleaner purifies room air safely.',
    evidenceSays:
      'Ozone (O3) chemically attacks and denatures lung epithelial tissue at concentrations as low as 0.05 ppm, triggering severe asthma attacks and permanent bronchial harm. EPA, CARB, and WHO strictly prohibit ozone-emitting cleaners.',
    shortAnswer: 'Ozone is a toxic pulmonary irritant that destroys lung tissue and generates formaldehyde.',
    verdict: 'myth',
    whatToDoInstead:
      'Use strictly mechanical HEPA filtration units with CARB zero-ozone certification.',
    citations: [
      { title: 'EPA: Ozone Generators Sold as Air Cleaners', url: 'https://www.epa.gov/iaq' },
      { title: 'CARB Air Cleaner Certification', url: 'https://ww2.arb.ca.gov' },
    ],
  },
];

export default function AskPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'chat' | 'myths'>('chat');

  return (
    <div className="max-w-3xl mx-auto min-h-dvh flex flex-col">
      {/* Sticky Top Page Header with blurred background */}
      <header className="sticky top-0 z-20 -mx-4 -mt-2 px-4 py-3 backdrop-blur-md bg-[var(--bg)]/90 border-b border-[var(--border)] mb-4 flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--text)]">
            Ask Saans
          </h1>
          <p className="text-xs text-[var(--muted)]">
            {t('ask.subtitle') || 'Evidence-grounded air quality coach · Gemini + Google Search'}
          </p>
        </div>
        <WhatsAppSummary />
      </header>

      {/* Segmented Navigation Tabs */}
      <div className="flex border-b border-[var(--border)] text-xs font-semibold mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`pb-2.5 px-3.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'chat'
              ? 'border-[var(--primary)] text-[var(--primary)] font-bold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          💬 AI Air Coach Chat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('myths')}
          className={`pb-2.5 px-3.5 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'myths'
              ? 'border-[var(--primary)] text-[var(--primary)] font-bold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          🚫 Common Myths Debunked
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'chat' ? (
        <div className="flex-1 animate-in fade-in duration-200">
          <AskChat />
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-200 pb-20">
          <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--muted)] shadow-2xs">
            <span className="font-bold text-[var(--text)]">
              Evidence-Based Myth Verification:
            </span>{' '}
            During severe winter pollution peaks, unproven folk remedies circulate widely on WhatsApp and social media,
            diverting families from effective measures like sealed HEPA purifiers and certified N95 respirators.
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
