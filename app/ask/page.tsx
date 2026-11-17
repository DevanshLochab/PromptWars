'use client';

import React, { useState } from 'react';
import { AskChat } from '@/components/ask/AskChat';
import { MythCheckCard, MythCheckItem } from '@/components/ask/MythCheckCard';
import { useTranslation, Language } from '@/lib/i18n';
import { WhatsAppSummary } from '@/components/common/WhatsAppSummary';
import { useProfile } from '@/lib/store/ProfileProvider';
import { Sparkles, Search, Loader2, ArrowRight } from 'lucide-react';
import { EvidenceGrade } from '@/components/receipt/EvidenceBadge';

export default function AskPage() {
  const { t } = useTranslation();
  const { profile, language } = useProfile();
  const [activeTab, setActiveTab] = useState<'chat' | 'myths'>('chat');

  // Interactive Live AI Myth Buster state
  const [claimInput, setClaimInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [customVerifiedMyth, setCustomVerifiedMyth] = useState<MythCheckItem | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleVerifyClaim = async (claimToTest?: string) => {
    const q = (claimToTest || claimInput).trim();
    if (!q || isVerifying) return;

    if (claimToTest) setClaimInput(claimToTest);
    setIsVerifying(true);
    setVerifyError(null);
    setCustomVerifiedMyth(null);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, profile, language }),
      });

      if (!res.ok) {
        throw new Error(`Verification failed with status ${res.status}`);
      }

      const data = await res.json();
      const grade = (data.evidenceGrade as EvidenceGrade) || 'D';
      const isMyth = Boolean(data.isMyth);
      let verdict: 'myth' | 'works' | 'partly' | 'depends' = 'depends';
      if (isMyth || grade === 'D') verdict = 'myth';
      else if (grade === 'A') verdict = 'works';
      else if (grade === 'B' || grade === 'C') verdict = 'partly';

      setCustomVerifiedMyth({
        claim: q,
        shortAnswer: data.shortAnswer,
        evidenceSays: data.evidenceExplanation || data.answer || '',
        verdict,
        whatToDoInstead: data.whatToDoInstead,
        citations: data.citations || [],
      });
    } catch (err) {
      console.error('Myth verification error:', err);
      setVerifyError(err instanceof Error ? err.message : 'Failed to verify claim. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const sampleClaims = [
    'Eating a spoonful of jaggery (gur) cleans smog from your lungs',
    'Keeping snake plants in the bedroom removes 90% of winter smog',
    'Wearing a simple cloth handkerchief protects against severe AQI smog',
    'Using an ozone generator purifies indoor air safely',
  ];

  return (
    <div className="max-w-3xl mx-auto min-h-dvh flex flex-col">
      {/* Sticky Top Page Header with blurred background */}
      <header className="sticky top-0 z-20 -mx-4 -mt-2 px-4 py-3 backdrop-blur-md bg-[var(--bg)]/90 border-b border-[var(--border)] mb-4 flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-xl font-extrabold tracking-tight text-[var(--text)]">
            Ask Saans
          </h1>
          <p className="text-xs text-[var(--muted)]">
            {t('ask.subtitle') || 'Evidence-grounded air quality coach · Gemini AI'}
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
          🚫 Live AI Myth Buster
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'chat' ? (
        <div className="flex-1 animate-in fade-in duration-200">
          <AskChat />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200 pb-20">
          {/* Interactive Live AI Myth Buster Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                <Sparkles size={18} className="text-[var(--primary)]" />
                <span>Test Any WhatsApp / Social Media Claim with AI</span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Heard a folk remedy or air purifier marketing claim? Type it below to evaluate against peer-reviewed atmospheric physics and WHO guidelines:
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyClaim();
              }}
              className="space-y-2"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={claimInput}
                  onChange={(e) => setClaimInput(e.target.value)}
                  placeholder="e.g. Eating jaggery cleans lungs, or plants replace air filters..."
                  disabled={isVerifying}
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--primary)]"
                />
                <button
                  type="submit"
                  disabled={!claimInput.trim() || isVerifying}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-[var(--primary)] text-[var(--on-primary)] hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0 shadow-xs"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      <span>Verify with AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-[var(--muted)] font-medium">Try:</span>
                {sampleClaims.map((claim, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleVerifyClaim(claim)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)] transition-colors cursor-pointer text-left"
                  >
                    {claim}
                  </button>
                ))}
              </div>
            </form>

            {verifyError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
                {verifyError}
              </div>
            )}

            {/* Display AI verified result */}
            {customVerifiedMyth && (
              <div className="pt-2 animate-in fade-in duration-300">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-2">
                  Live AI Verification Result:
                </p>
                <MythCheckCard item={customVerifiedMyth} />
              </div>
            )}
          </div>

          {/* Context Explainer */}
          <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)] shadow-2xs">
            <span className="font-bold text-[var(--text)]">
              Evidence-Based Verification Standards:
            </span>{' '}
            During severe winter pollution peaks, unproven folk remedies circulate widely on WhatsApp and social media,
            diverting families from effective measures like sealed HEPA purifiers and certified N95 respirators.
            Saans grades all claims with zero commercial bias.
          </div>
        </div>
      )}
    </div>
  );
}
