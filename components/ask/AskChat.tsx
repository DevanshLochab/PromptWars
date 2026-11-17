'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { EvidenceGrade } from '@/components/receipt/EvidenceBadge';
import { MythCheckCard, TypingIndicator, VerdictType } from './MythCheckCard';
import { useTranslation } from '@/lib/i18n';
import { useProfile } from '@/lib/store/ProfileProvider';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  shortAnswer?: string;
  evidenceGrade?: EvidenceGrade;
  citations?: Array<{ title: string; url: string }>;
  whatToDoInstead?: string;
  isMyth?: boolean;
  verdict?: VerdictType;
  medicalDisclaimer?: boolean | string;
  timestamp: string;
}

const SEED_QA: Array<{
  keywords: string[];
  question: string;
  answer: string;
  shortAnswer: string;
  grade: EvidenceGrade;
  verdict: VerdictType;
  citations: Array<{ title: string; url: string }>;
  whatToDoInstead?: string;
  isMyth?: boolean;
  medicalDisclaimer?: boolean | string;
}> = [
  {
    keywords: ['mask', 'cloth', 'surgical', 'n95', 'bandana', 'dupatta'],
    question: 'Does wearing a cloth mask help?',
    shortAnswer: 'Cloth masks offer negligible (<20%) protection against fine PM2.5.',
    answer:
      'Cloth weaves and ordinary surgical masks have porous pore sizes (20–100 µm) and leave wide peripheral gaps around the nose and jaw. Ambient winter smog is dominated by sub-micron combustion particles (0.1–2.5 µm). Controlled NIOSH/CDC trials show cloth masks filter less than 15–20% of fine aerosol, with total inward leakage exceeding 70%. In contrast, electrostatically charged, tight-fitting N95/FFP2 respirators block >95% of particles when sealed.',
    grade: 'D',
    verdict: 'myth',
    citations: [
      { title: 'CDC / NIOSH Particulate Respirator Guidance', url: 'https://www.cdc.gov/niosh/npptl/topics/respirators/disp_part/default.html' },
      { title: 'WHO Personal Respiratory Protection in Smog', url: 'https://www.who.int/publications/i/item/9789240034228' },
    ],
    whatToDoInstead:
      'Use a certified NIOSH N95, EN149 FFP2, or BIS ISI 9473 rated cup- or bifold-style respirator. Perform a fit-check by breathing sharply to ensure no air leaks at the nose clip.',
    isMyth: true,
  },
  {
    keywords: ['ventilate', 'open window', 'winter', 'fresh air', 'window', 'windows', 'safe to open'],
    question: 'Is it safe to open windows today?',
    shortAnswer: 'Only between 12:00 PM and 3:30 PM, when solar warming lifts the boundary layer.',
    answer:
      'Winter smog exhibits a diurnal thermal inversion. Nocturnal cooling traps ground-level emissions under a shallow planetary boundary layer (100–200m), causing peak AQI (350–500+) between 11 PM and 9 AM. By midday (12 PM to 3 PM), solar radiation warms the surface, expanding the atmospheric mixing height to 600–900m and lowering surface PM2.5 by 30–50%. This midday afternoon window is the safest time for a brief 15-minute cross-ventilation flush.',
    grade: 'B',
    verdict: 'partly',
    citations: [
      { title: 'CPCB / IIT-Delhi Atmospheric Boundary Layer Studies', url: 'https://cpcb.nic.in' },
    ],
    whatToDoInstead:
      'Ventilate briefly between 12:30 PM and 3:00 PM on sunny afternoons, then reseal and run purifiers.',
  },
  {
    keywords: ['plant', 'plants', 'snake plant', 'areca', 'spider plant', 'nasa'],
    question: 'Do indoor plants clean winter smog?',
    shortAnswer: 'No. Houseplants do not measurably reduce PM2.5 or VOCs in real homes.',
    answer:
      'While the 1989 NASA Clean Air Study observed chemical reduction in tiny, airtight 1m³ glass chambers over 24 hours, subsequent peer-reviewed reviews (Waring et al., Journal of Exposure Science 2020) demonstrated that in typical homes with 0.5 air changes per hour, you would need 10 to 100 plants per square meter to equal the clean air delivery of a single basic HEPA purifier. Plants also have zero mechanism to remove fine particulate matter (PM2.5).',
    grade: 'D',
    verdict: 'myth',
    citations: [
      { title: 'Waring et al. (Nature J Exp Sci 2020)', url: 'https://www.nature.com/articles/s41370-019-0175-9' },
      { title: 'EPA Indoor Plants & Air Cleaners Guide', url: 'https://www.epa.gov/indoor-air-quality-iaq/indoor-air-cleaners-and-air-filters' },
    ],
    whatToDoInstead:
      'Deploy a true mechanical HEPA filter or build a DIY Corsi-Rosenthal box fan purifier with MERV-13 filters.',
    isMyth: true,
  },
  {
    keywords: ['steam', 'jaggery', 'gur', 'ghee', 'detox', 'clean lungs'],
    question: 'Does eating jaggery or steam detox lungs?',
    shortAnswer: 'No. Dietary items and steam cannot remove inhaled fine PM2.5 from pulmonary alveoli.',
    answer:
      'Inhaled fine particles (PM2.5) penetrate deep into the microscopic alveolar sacs and directly enter the bloodstream across the capillary barrier. Ingested food (like jaggery) enters the digestive tract (stomach and intestines) and has no anatomical pathway to extract particles from lung tissue. While steam may temporarily hydrate congested nasal passages, it does not purge PM2.5 or reverse bronchial inflammation. Excessive hot steam can also burn nasal mucosa.',
    grade: 'D',
    verdict: 'myth',
    citations: [
      { title: 'WHO Compendium on Air Pollution & Health', url: 'https://www.who.int/teams/environment-climate-change-and-health/air-quality-and-health' },
      { title: 'American Lung Association: Inhaled Particulates', url: 'https://www.lung.org' },
    ],
    whatToDoInstead:
      'Wear a well-fitted certified N95/FFP2 respirator when outdoors and run bedroom HEPA filtration indoors to stop particles from entering your airways.',
    isMyth: true,
    medicalDisclaimer: true,
  },
  {
    keywords: ['door', 'open door', 'purifier door', 'room closed'],
    question: 'Should bedroom doors stay closed with air purifiers?',
    shortAnswer: 'Yes. Keeping the door closed allows the purifier CADR to overcome room air infiltration.',
    answer:
      'An air purifier operates on clean air delivery rate (CADR) in relation to room volume. When doors or large hallway apertures remain open, the effective air volume triples or quadruples, and contaminated ambient air continuously infiltrates from unpurified living areas. Keeping bedroom doors closed allows steady-state particle concentration (C_in) to drop by 70–85% within 30–45 minutes.',
    grade: 'A',
    verdict: 'works',
    citations: [
      { title: 'ASHRAE Standard 62.2 & Infiltration Dynamics', url: 'https://www.ashrae.org' },
    ],
    whatToDoInstead:
      'Keep bedroom doors and windows shut while running your air cleaner on medium or high.',
  },
  {
    keywords: ['ozone', 'ionizer', 'ionic', 'active oxygen'],
    question: 'Are ozone generators safe for rooms?',
    shortAnswer: 'DANGEROUS. Ozone is a toxic pulmonary irritant prohibited for occupied indoor spaces.',
    answer:
      'Ozone (O3) chemically attacks and denatures lung epithelial tissue at concentrations as low as 0.05 ppm, triggering severe asthma exacerbations and permanent pulmonary damage. Furthermore, chemical reactions between ozone and household fragrances/terpenes generate hazardous secondary formaldehyde and ultrafine aerosols. EPA, California Air Resources Board (CARB), and WHO strictly warn against any air cleaner that produces ozone.',
    grade: 'D',
    verdict: 'myth',
    citations: [
      { title: 'EPA: Ozone Generators that are Sold as Air Cleaners', url: 'https://www.epa.gov/indoor-air-quality-iaq/ozone-generators-are-sold-air-cleaners' },
      { title: 'CARB Certified Air Cleaning Devices Regulations', url: 'https://ww2.arb.ca.gov' },
    ],
    whatToDoInstead:
      'Use only strictly mechanical HEPA/filter purifiers with CARB zero-ozone certification.',
    isMyth: true,
    medicalDisclaimer: true,
  },
];

const SUGGESTED_PROMPTS = [
  'Does wearing a cloth mask help?',
  'Is it safe to open windows today?',
  'Do indoor plants clean winter smog?',
  'Does eating jaggery or steam detox lungs?',
  'Should bedroom doors stay closed with air purifiers?',
  'Are ozone generators safe for rooms?',
];

export function AskChat() {
  const { t } = useTranslation();
  const { profile, language } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_initial_1',
      sender: 'user',
      text: 'Do indoor plants clean winter smog?',
      timestamp: '10:00 AM',
    },
    {
      id: 'msg_initial_2',
      sender: 'ai',
      text: SEED_QA[2].answer,
      shortAnswer: SEED_QA[2].shortAnswer,
      evidenceGrade: SEED_QA[2].grade,
      verdict: SEED_QA[2].verdict,
      citations: SEED_QA[2].citations,
      whatToDoInstead: SEED_QA[2].whatToDoInstead,
      isMyth: true,
      timestamp: '10:00 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      scrollToBottom();
    }, 50);

    // Check if matching seed QA exists locally
    const qLower = q.toLowerCase();
    const matchedSeed = SEED_QA.find((item) =>
      item.keywords.some((kw) => qLower.includes(kw))
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, profile, language }),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json();
        const grade = (data.evidenceGrade as EvidenceGrade) || 'B';
        const isMyth = Boolean(data.isMyth);
        let verdict: VerdictType = 'depends';
        if (isMyth || grade === 'D') verdict = 'myth';
        else if (grade === 'A') verdict = 'works';
        else if (grade === 'B' || grade === 'C') verdict = 'partly';

        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: data.evidenceExplanation || data.answer || data.text,
          shortAnswer: data.shortAnswer,
          evidenceGrade: grade,
          verdict,
          citations: data.citations || [{ title: 'WHO Air Quality Guidelines 2021', url: 'https://who.int' }],
          whatToDoInstead: data.whatToDoInstead,
          isMyth,
          medicalDisclaimer: data.medicalDisclaimer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }
    } catch {
      // ignore, fall back below
    }

    // High-quality local evidence responder fallback
    setTimeout(() => {
      let aiMsg: ChatMessage;

      if (matchedSeed) {
        aiMsg = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: matchedSeed.answer,
          shortAnswer: matchedSeed.shortAnswer,
          evidenceGrade: matchedSeed.grade,
          verdict: matchedSeed.verdict,
          citations: matchedSeed.citations,
          whatToDoInstead: matchedSeed.whatToDoInstead,
          isMyth: matchedSeed.isMyth,
          medicalDisclaimer: matchedSeed.medicalDisclaimer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      } else {
        aiMsg = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: `Regarding "${q}": Fine PM2.5 particulates are sub-micron combustion aerosols (soot, sulfates, nitrates). In indoor spaces, air quality is determined by infiltration through building gaps, indoor source generation, and mechanical filtration CADR. Reducing exposure requires sealing windows during peak smog hours, using certified HEPA purifiers with closed interior doors, and wearing a sealed N95 respirator outdoors.`,
          shortAnswer: 'Prioritize certified HEPA filtration and sealed N95 respirators over unverified folk remedies.',
          evidenceGrade: 'B',
          verdict: 'partly',
          citations: [
            { title: 'WHO Air Quality Guidelines 2021', url: 'https://www.who.int' },
            { title: 'EPA Indoor Air Quality Standards', url: 'https://www.epa.gov/iaq' },
          ],
          medicalDisclaimer: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* First-time suggestion pills — wrap flex (not horizontal scroll) */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5">
          <span>💡</span>
          <span>{t('ask.suggestions') || 'Suggested questions'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="border border-[var(--border)] rounded-full rounded-[var(--radius-pill)] px-3 py-2 text-sm text-[var(--text)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer text-left shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages list — page scrolls, no inner overflow-y-auto */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="w-full">
            {msg.sender === 'user' ? (
              /* Question bubble (right, primary bg) */
              <div className="flex justify-end">
                <div className="max-w-[85%] sm:max-w-[75%] bg-[var(--primary)] text-[var(--on-primary)] rounded-2xl rounded-tr-xs px-4 py-3 text-sm font-medium shadow-xs leading-relaxed">
                  <p>{msg.text}</p>
                  {msg.timestamp && (
                    <span className="text-[10px] opacity-75 mt-1 block text-right font-normal">
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Answer card (left, surface bg) */
              <div className="flex justify-start w-full">
                <div className="w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%]">
                  <MythCheckCard
                    answer={msg.text}
                    shortAnswer={msg.shortAnswer}
                    verdict={msg.verdict}
                    isMyth={msg.isMyth}
                    evidenceGrade={msg.evidenceGrade}
                    citations={msg.citations}
                    whatToDoInstead={msg.whatToDoInstead}
                    medicalDisclaimer={msg.medicalDisclaimer}
                    timestamp={msg.timestamp}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator: 3 animated dots while loading */}
        {isTyping && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}
      </div>

      {/* Spacer (at least 80px so composer doesn't cover last message) */}
      <div className="h-28 shrink-0" aria-hidden="true" />
      <div ref={messagesEndRef} />

      {/* Sticky bottom: composer input + send button (ABOVE bottom nav) */}
      <div className="fixed bottom-[var(--nav-h)] left-0 right-0 z-30 p-3 bg-[var(--surface)] border-t border-[var(--border)] shadow-md lg:sticky lg:bottom-0 lg:left-auto lg:right-auto lg:z-10 lg:rounded-2xl lg:border lg:bg-[var(--surface)]/95 lg:backdrop-blur-md lg:mb-2 lg:shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="max-w-3xl mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('ask.placeholder') || 'Ask anything about smog, masks, purifiers, or myths...'}
            disabled={isTyping}
            className="flex-1 px-4 py-3 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)] transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="px-5 py-3 text-sm font-semibold bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 disabled:opacity-50 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <span>{t('ask.button') || 'Send'}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
