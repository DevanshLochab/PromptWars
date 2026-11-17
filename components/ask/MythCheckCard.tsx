'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { EvidenceBadge, EvidenceGrade } from '@/components/receipt/EvidenceBadge';
import { useTranslation } from '@/lib/i18n';

export type VerdictType = 'works' | 'myth' | 'partly' | 'depends';

export interface MythCitation {
  title: string;
  url: string;
}

export interface MythCheckItem {
  claim?: string;
  evidenceSays?: string;
  answer?: string;
  shortAnswer?: string;
  whatToDoInstead?: string;
  citations?: MythCitation[];
  verdict?: VerdictType;
  isMyth?: boolean;
  evidenceGrade?: EvidenceGrade;
  medicalDisclaimer?: string | boolean;
}

export interface MythCheckCardProps {
  item?: MythCheckItem;
  claim?: string;
  answer?: string;
  shortAnswer?: string;
  evidenceSays?: string;
  whatToDoInstead?: string;
  citations?: MythCitation[];
  verdict?: VerdictType;
  isMyth?: boolean;
  evidenceGrade?: EvidenceGrade;
  medicalDisclaimer?: string | boolean;
  timestamp?: string;
  className?: string;
}

export function TypingIndicator() {
  return (
    <div
      data-testid="typing-indicator"
      className="flex items-center gap-2.5 px-4 py-3 rounded-2xl rounded-tl-xs bg-[var(--surface)] border border-[var(--border)] shadow-xs w-fit animate-in fade-in duration-200"
    >
      <span className="text-xs font-medium text-[var(--muted)]">Saans is thinking</span>
      <div className="flex items-center gap-1">
        <span
          className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce"
          style={{ animationDuration: '900ms', animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce"
          style={{ animationDuration: '900ms', animationDelay: '200ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce"
          style={{ animationDuration: '900ms', animationDelay: '400ms' }}
        />
      </div>
    </div>
  );
}

export function MythCheckCard({
  item,
  claim,
  answer,
  shortAnswer,
  evidenceSays,
  whatToDoInstead,
  citations,
  verdict,
  isMyth,
  evidenceGrade,
  medicalDisclaimer,
  timestamp,
  className = '',
}: MythCheckCardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  // Normalize data between direct props and item prop
  const effectiveClaim = claim ?? item?.claim;
  const effectiveAnswer = answer ?? item?.answer ?? evidenceSays ?? item?.evidenceSays ?? '';
  const effectiveShortAnswer = shortAnswer ?? item?.shortAnswer;
  const effectiveWhatToDo = whatToDoInstead ?? item?.whatToDoInstead;
  const effectiveCitations = citations ?? item?.citations;
  const effectiveGrade = evidenceGrade ?? item?.evidenceGrade;
  const effectiveIsMyth = isMyth ?? item?.isMyth;
  const effectiveDisclaimer = medicalDisclaimer ?? item?.medicalDisclaimer;

  // Determine verdict
  let effectiveVerdict: VerdictType;
  if (verdict ?? item?.verdict) {
    effectiveVerdict = (verdict ?? item?.verdict)!;
  } else if (effectiveIsMyth === true || effectiveGrade === 'D') {
    effectiveVerdict = 'myth';
  } else if (effectiveGrade === 'A') {
    effectiveVerdict = 'works';
  } else if (effectiveGrade === 'B' || effectiveGrade === 'C') {
    effectiveVerdict = 'partly';
  } else {
    effectiveVerdict = 'depends';
  }

  const verdictStyles: Record<VerdictType, { label: string; chipClass: string }> = {
    works: {
      label: '✓ Works',
      chipClass:
        'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
    },
    myth: {
      label: '✗ Myth',
      chipClass:
        'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
    },
    partly: {
      label: '~ Partly true',
      chipClass:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
    },
    depends: {
      label: '? Depends',
      chipClass:
        'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
  };

  const handleCopy = async () => {
    const parts: string[] = [];
    if (effectiveClaim) parts.push(`Claim: "${effectiveClaim}"`);
    parts.push(`Verdict: ${verdictStyles[effectiveVerdict].label}`);
    if (effectiveShortAnswer) parts.push(effectiveShortAnswer);
    if (effectiveAnswer && effectiveAnswer !== effectiveShortAnswer) {
      parts.push(effectiveAnswer);
    }
    if (effectiveWhatToDo) parts.push(`Do this instead: ${effectiveWhatToDo}`);
    if (effectiveCitations && effectiveCitations.length > 0) {
      parts.push(`Evidence Sources:\n${effectiveCitations.map((c) => `• ${c.title}: ${c.url}`).join('\n')}`);
    }
    parts.push('— Saans Air Quality Coach (Gemini + Google Search)');

    try {
      await navigator.clipboard.writeText(parts.join('\n\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs space-y-3.5 text-[var(--text)] transition-all ${className}`}
    >
      {/* Top Header: Verdict chip + Optional Grade Badge + Copy button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border shadow-2xs ${verdictStyles[effectiveVerdict].chipClass}`}
          >
            {verdictStyles[effectiveVerdict].label}
          </span>
          {effectiveGrade && (
            <EvidenceBadge grade={effectiveGrade} showWhyInline={false} />
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy answer"
          title={copied ? 'Copied!' : 'Copy to clipboard'}
          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer shrink-0"
        >
          {copied ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Copied</span>
            </span>
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Claim checked (if applicable) */}
      {effectiveClaim && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            {t('ask.myth_badge') || 'Claim'}
          </span>
          <h3
            className={`text-sm sm:text-base font-bold text-[var(--text)] leading-snug ${
              effectiveVerdict === 'myth'
                ? 'line-through decoration-rose-500/80 decoration-2'
                : ''
            }`}
          >
            &ldquo;{effectiveClaim}&rdquo;
          </h3>
        </div>
      )}

      {/* Short Answer / Headline */}
      {effectiveShortAnswer && (
        <div className="text-sm font-semibold text-[var(--text)] leading-snug">
          {effectiveShortAnswer}
        </div>
      )}

      {/* 2-3 sentence answer / Evidence Explanation */}
      {effectiveAnswer && effectiveAnswer !== effectiveShortAnswer && (
        <p className="text-xs sm:text-sm text-[var(--text)]/90 leading-relaxed">
          {effectiveAnswer}
        </p>
      )}

      {/* Green "Do this instead" card (if myth or partly true) */}
      {effectiveWhatToDo && (effectiveVerdict === 'myth' || effectiveVerdict === 'partly') && (
        <div className="p-3.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
            <span>✅</span>
            <span>{t('ask.myth_what_to_do') || 'Do this instead'}</span>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
            {effectiveWhatToDo}
          </p>
        </div>
      )}

      {/* Medical Disclaimer notice (if relevant) */}
      {effectiveDisclaimer && (
        <div className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
          ⚠️ <em>Notice:</em>{' '}
          {typeof effectiveDisclaimer === 'string'
            ? effectiveDisclaimer
            : 'Not personal medical advice. For severe coughing or respiratory distress, consult a certified physician.'}
        </div>
      )}

      {/* "Show evidence ↓" expander showing source chips */}
      {effectiveCitations && effectiveCitations.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowEvidence((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors py-1 cursor-pointer"
          >
            <span>{showEvidence ? 'Hide evidence ↑' : 'Show evidence ↓'}</span>
            <span className="text-[11px] opacity-75">
              ({effectiveCitations.length} source{effectiveCitations.length > 1 ? 's' : ''})
            </span>
          </button>
          {showEvidence && (
            <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in duration-150">
              {effectiveCitations.map((cite, idx) => (
                <a
                  key={idx}
                  href={cite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-sky-700 dark:text-sky-300 hover:border-sky-500 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                  <span className="truncate max-w-[240px]">{cite.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between text-[11px] text-[var(--muted)]">
        <span>Answered with Gemini + Google Search · not medical advice</span>
        {timestamp && <span className="opacity-75">{timestamp}</span>}
      </div>
    </div>
  );
}
