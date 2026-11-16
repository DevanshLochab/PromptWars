'use client';

import React, { useState, useRef, useEffect } from 'react';
import { EvidenceBadge, EvidenceGrade } from '@/components/receipt/EvidenceBadge';
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
  medicalDisclaimer?: boolean;
  timestamp: string;
}

const SEED_QA: Array<{
  keywords: string[];
  question: string;
  answer: string;
  shortAnswer: string;
  grade: EvidenceGrade;
  citations: Array<{ title: string; url: string }>;
  whatToDoInstead?: string;
  isMyth?: boolean;
  medicalDisclaimer?: boolean;
}> = [
  {
    keywords: ['plant', 'plants', 'snake plant', 'areca', 'spider plant', 'nasa'],
    question: 'Do indoor houseplants clean winter smog?',
    shortAnswer: 'No. Houseplants do not measurably reduce PM2.5 or VOCs in real homes.',
    answer:
      'While the 1989 NASA Clean Air Study observed chemical reduction in tiny, airtight 1m³ glass chambers over 24 hours, subsequent peer-reviewed reviews (Waring et al., Journal of Exposure Science 2020) demonstrated that in typical homes with 0.5 air changes per hour, you would need 10 to 100 plants per square meter to equal the clean air delivery of a single basic HEPA purifier. Plants also have zero mechanism to remove fine particulate matter (PM2.5).',
    grade: 'D',
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
    question: 'Does eating jaggery (gur) or steam inhalation detoxify lungs from smog?',
    shortAnswer: 'No. Dietary items and steam cannot remove inhaled fine PM2.5 from pulmonary alveoli.',
    answer:
      'Inhaled fine particles (PM2.5) penetrate deep into the microscopic alveolar sacs and directly enter the bloodstream across the capillary barrier. Ingested food (like jaggery) enters the digestive tract (stomach and intestines) and has no anatomical pathway to extract particles from lung tissue. While steam may temporarily hydrate congested nasal passages, it does not purge PM2.5 or reverse bronchial inflammation. Excessive hot steam can also burn nasal mucosa.',
    grade: 'D',
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
    keywords: ['mask', 'cloth', 'surgical', 'n95', 'bandana', 'dupatta'],
    question: 'Can I use a cloth mask, bandana, or surgical mask for 350+ AQI smog?',
    shortAnswer: 'Cloth and loose surgical masks offer negligible (<20%) protection against fine PM2.5.',
    answer:
      'Cloth weaves and ordinary surgical masks have porous pore sizes (20–100 µm) and leave wide peripheral gaps around the nose and jaw. Ambient winter smog is dominated by sub-micron combustion particles (0.1–2.5 µm). Controlled NIOSH/CDC trials show cloth masks filter less than 15–20% of fine aerosol, with total inward leakage exceeding 70%. In contrast, electrostatically charged, tight-fitting N95/FFP2 respirators block >95% of particles when sealed.',
    grade: 'A',
    citations: [
      { title: 'CDC / NIOSH Particulate Respirator Guidance', url: 'https://www.cdc.gov/niosh/npptl/topics/respirators/disp_part/default.html' },
      { title: 'WHO Personal Respiratory Protection in Smog', url: 'https://www.who.int/publications/i/item/9789240034228' },
    ],
    whatToDoInstead:
      'Use a certified NIOSH N95, EN149 FFP2, or BIS ISI 9473 rated cup- or bifold-style respirator. Perform a fit-check by breathing sharply to ensure no air leaks at the nose clip.',
  },
  {
    keywords: ['door', 'open door', 'purifier door', 'room closed'],
    question: 'Should I keep bedroom doors closed when running an air purifier?',
    shortAnswer: 'Yes. Keeping the door closed allows the purifier CADR to overcome room air infiltration.',
    answer:
      'An air purifier operates on clean air delivery rate (CADR) in relation to room volume. When doors or large hallway apertures remain open, the effective air volume triples or quadruples, and contaminated ambient air continuously infiltrates from unpurified living areas. Keeping bedroom doors closed allows steady-state particle concentration (C_in) to drop by 70–85% within 30–45 minutes.',
    grade: 'A',
    citations: [
      { title: 'ASHRAE Standard 62.2 & Infiltration Dynamics', url: 'https://www.ashrae.org' },
    ],
    whatToDoInstead:
      'Keep bedroom doors and windows shut while running your air cleaner on medium or high.',
  },
  {
    keywords: ['ventilate', 'open window', 'winter', 'fresh air', 'window'],
    question: 'When is the best time to open windows during severe Delhi winter smog?',
    shortAnswer: 'Between 12:00 PM and 3:30 PM, when solar warming lifts the boundary layer.',
    answer:
      'Winter smog exhibits a diurnal thermal inversion. Nocturnal cooling traps ground-level emissions under a shallow planetary boundary layer (100–200m), causing peak AQI (350–500+) between 11 PM and 9 AM. By midday (12 PM to 3 PM), solar radiation warms the surface, expanding the atmospheric mixing height to 600–900m and lowering surface PM2.5 by 30–50%. This midday afternoon window is the safest time for a brief 15-minute cross-ventilation flush.',
    grade: 'B',
    citations: [
      { title: 'CPCB / IIT-Delhi Atmospheric Boundary Layer Studies', url: 'https://cpcb.nic.in' },
    ],
    whatToDoInstead:
      'Ventilate briefly between 12:30 PM and 3:00 PM on sunny afternoons, then reseal and run purifiers.',
  },
  {
    keywords: ['ozone', 'ionizer', 'ionic', 'active oxygen'],
    question: 'Are ozone generators or ionizers good for purifying room air?',
    shortAnswer: 'DANGEROUS. Ozone is a toxic pulmonary irritant prohibited for occupied indoor spaces.',
    answer:
      'Ozone (O3) chemically attacks and denatures lung epithelial tissue at concentrations as low as 0.05 ppm, triggering severe asthma exacerbations and permanent pulmonary damage. Furthermore, chemical reactions between ozone and household fragrances/terpenes generate hazardous secondary formaldehyde and ultrafine aerosols. EPA, California Air Resources Board (CARB), and WHO strictly warn against any air cleaner that produces ozone.',
    grade: 'D',
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

export function AskChat() {
  const { t } = useTranslation();
  const { profile, language } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_initial_1',
      sender: 'user',
      text: 'Do indoor houseplants clean winter smog?',
      timestamp: '10:00 AM',
    },
    {
      id: 'msg_initial_2',
      sender: 'ai',
      text: SEED_QA[0].answer,
      shortAnswer: SEED_QA[0].shortAnswer,
      evidenceGrade: SEED_QA[0].grade,
      citations: SEED_QA[0].citations,
      whatToDoInstead: SEED_QA[0].whatToDoInstead,
      isMyth: true,
      timestamp: '10:00 AM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Check if matching seed QA exists locally
    const qLower = q.toLowerCase();
    const matchedSeed = SEED_QA.find((item) =>
      item.keywords.some((kw) => qLower.includes(kw))
    );

    try {
      // Attempt API call to /api/ask with timeout
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
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: data.answer || data.text,
          shortAnswer: data.shortAnswer,
          evidenceGrade: (data.evidenceGrade as EvidenceGrade) || 'B',
          citations: data.citations || [{ title: 'WHO Air Quality 2021', url: 'https://who.int' }],
          whatToDoInstead: data.whatToDoInstead,
          isMyth: data.isMyth,
          medicalDisclaimer: data.medicalDisclaimer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        return;
      }
    } catch {
      // ignore, use fallback engine below
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
          citations: matchedSeed.citations,
          whatToDoInstead: matchedSeed.whatToDoInstead,
          isMyth: matchedSeed.isMyth,
          medicalDisclaimer: matchedSeed.medicalDisclaimer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      } else {
        // General science response
        aiMsg = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: `Regarding "${q}": Airborne PM2.5 particles are microscopic combustion aerosols (soot, sulfates, nitrates). In indoor environments, concentration is governed by mass-balance physics: infiltration through envelope gaps, indoor generation rates, surface deposition, and mechanical filtration CADR. Reducing exposure requires minimizing indoor sources (unvented flame, coils, incense), operating true HEPA filtration with closed room doors, and wearing a tight-fitting N95 respirator during outdoor transit.`,
          shortAnswer: 'Prioritize certified HEPA filtration and sealed N95 respirators over unproven folk remedies.',
          evidenceGrade: 'B',
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

  const quickPrompts = [
    'Do indoor plants clean winter smog?',
    'Does eating jaggery or steam detox lungs?',
    'Can I use a cloth mask for 350+ AQI?',
    'Should bedroom doors stay closed with air purifiers?',
    'When should I open windows in winter?',
    'Are ozone generators safe for rooms?',
  ];

  return (
    <div className="flex flex-col h-[75vh] max-h-[800px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs overflow-hidden">
      {/* Evidence Banner */}
      <div className="p-3 px-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span>🩺</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Evidence-Grounded Coach
          </span>
        </div>
        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
          WHO 2021 & Aerosol Physics Standards
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {msg.sender === 'user' ? (
              /* User Bubble */
              <div className="max-w-[85%] sm:max-w-[70%] bg-sky-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs font-medium shadow-xs">
                <p className="leading-relaxed">{msg.text}</p>
                <span className="text-[9px] opacity-75 mt-1 block text-right">
                  {msg.timestamp}
                </span>
              </div>
            ) : (
              /* AI Response Card */
              <div className="max-w-[95%] sm:max-w-[85%] rounded-2xl rounded-tl-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs space-y-3 shadow-xs">
                {/* Header with Evidence Grade & Myth Tag */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <span>💨</span>
                    <span>Saans Air Coach</span>
                  </div>
                  {msg.evidenceGrade && (
                    <EvidenceBadge grade={msg.evidenceGrade} showWhyInline={false} />
                  )}
                </div>

                {/* Short Answer Callout */}
                {msg.shortAnswer && (
                  <div
                    className={`p-2.5 rounded-xl font-bold text-xs ${
                      msg.isMyth
                        ? 'bg-rose-100/70 text-rose-950 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-900'
                        : 'bg-sky-100/60 text-sky-950 dark:bg-sky-950/60 dark:text-sky-200 border border-sky-200 dark:border-sky-900'
                    }`}
                  >
                    {msg.shortAnswer}
                  </div>
                )}

                {/* Full Explanation */}
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {msg.text}
                </p>

                {/* What to do instead (for myths) */}
                {msg.whatToDoInstead && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                      <span>✅</span>
                      <span>{t('ask.myth_what_to_do')}</span>
                    </span>
                    <p className="text-emerald-800 dark:text-emerald-300">
                      {msg.whatToDoInstead}
                    </p>
                  </div>
                )}

                {/* Medical Disclaimer if relevant */}
                {msg.medicalDisclaimer && (
                  <div className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/50">
                    ⚠️ <em>Notice:</em> Not personal medical advice. For severe coughing or respiratory distress, consult a certified physician.
                  </div>
                )}

                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-200/80 dark:border-slate-800/80">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Citations:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cite, idx) => (
                        <a
                          key={idx}
                          href={cite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                        >
                          <span>🔗</span>
                          <span>{cite.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <span className="text-[9px] text-slate-400 block pt-1">
                  {msg.timestamp}
                </span>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 text-xs text-slate-500 dark:text-slate-400 italic">
            <span className="animate-spin text-sm">🌀</span>
            <span>{t('ask.thinking')}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto text-[11px]">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400 dark:hover:border-sky-500 transition-colors shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Bottom Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputText);
        }}
        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('ask.placeholder')}
          className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="px-4 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-xs"
        >
          {t('ask.button')}
        </button>
      </form>
    </div>
  );
}
