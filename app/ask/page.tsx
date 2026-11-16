'use client';

import React, { useState } from 'react';
import { useProfile } from '@/lib/store/ProfileProvider';

export default function AskPage() {
  const { language } = useProfile();
  const [question, setQuestion] = useState('');

  const quickPrompts = [
    'Do indoor plants clean smog?',
    'Does steam inhalation detox lungs?',
    'When should I open windows in Delhi winter?',
    'Is a cloth mask effective at 300 AQI?',
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Ask Saans AI Air Coach
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ask any question about aerosol physics, mask ratings, purifier sizing, or myth verification.
        </p>
      </div>

      {/* Question Input Box */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'हवा की गुणवत्ता या वायु प्रदूषण से जुड़े अपने सवाल यहाँ पूछें...'
                : 'Ask a question (e.g. Can I run an air purifier with the door cracked?)...'
            }
            className="w-full h-28 p-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 resize-none shadow-xs"
          />
          <button
            type="button"
            className="absolute bottom-3 right-3 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs"
          >
            Ask
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-500">Suggested Topics:</span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setQuestion(prompt)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-sky-400 dark:hover:border-sky-500 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence & Medical Citation Guarantee */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <span>🩺</span>
          <span>Grounded in Evidence</span>
        </div>
        <p>
          Saans answers draw strictly from WHO 2021 Housing and Ambient guidelines, EPA AirNow, CDC
          Carbon Monoxide advisories, and peer-reviewed aerosol physics literature. We never recommend
          unproven detox remedies or harmful ozone devices.
        </p>
      </div>
    </div>
  );
}
