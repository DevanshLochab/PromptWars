'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, HelpCircle } from 'lucide-react';
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

const SUGGESTED_PROMPTS = [
  'Does wearing a cloth mask or bandana help against smog?',
  'Is it safe to open windows today for ventilation?',
  'Do indoor snake plants clean winter smog?',
  'Does eating jaggery (gur) or steam detox lungs?',
  'Should bedroom doors stay closed when running an air purifier?',
  'Are ozone generators or ionic purifiers safe for homes?',
  'How does severe AQI affect asthma or senior citizens?',
];

export function AskChat() {
  const { t } = useTranslation();
  const { profile, language } = useProfile();
  // Starts with NO hardcoded chat messages!
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      scrollToBottom();
    }
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
    setRequestError(null);

    setTimeout(() => {
      scrollToBottom();
    }, 50);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, profile, language }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error || `Ask request failed with status ${res.status}`);
      }

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
        citations: data.citations || [],
        whatToDoInstead: data.whatToDoInstead,
        isMyth,
        medicalDisclaimer: data.medicalDisclaimer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
      setRequestError(null);
    } catch (error) {
      console.error('Ask request failed:', error);
      setRequestError(error instanceof Error ? error.message : String(error));
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setRequestError(null);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Empty State when no messages have been sent */}
      {messages.length === 0 ? (
        <div className="flex flex-col items-center text-center py-8 px-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-5 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shadow-xs">
            <Sparkles size={28} />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">
              {t('ask.title') || 'Saans AI Air Quality Coach'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Ask anything about air quality, exposure mitigation, HEPA purifiers, masks, or verify any claim with environmental health science.
            </p>
          </div>

          {/* Suggested question chips */}
          <div className="w-full max-w-xl space-y-2 pt-2">
            <div className="text-xs font-semibold text-[var(--muted)] flex items-center justify-center gap-1.5">
              <HelpCircle size={14} className="text-[var(--primary)]" />
              <span>Tap a popular question to ask AI:</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="border border-[var(--border)] rounded-full px-3.5 py-2 text-xs font-medium text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--border)] hover:border-[var(--muted)] transition-all cursor-pointer text-left shadow-2xs hover:scale-[1.01]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Messages Container with Clear Button */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[var(--muted)]">
              Conversation with Saans AI
            </span>
            <button
              type="button"
              onClick={handleClearChat}
              className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--danger)] transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Clear chat</span>
            </button>
          </div>

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

          {requestError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-3 text-sm text-rose-800 dark:text-rose-200"
            >
              {requestError}
            </div>
          )}
        </div>
      )}

      {/* Spacer (so composer doesn't cover last message) */}
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
            placeholder={
              t('ask.placeholder') ||
              'Ask anything about smog, masks, purifiers, or myths...'
            }
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

export default AskChat;
