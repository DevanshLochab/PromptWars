'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

interface OfflineBannerProps {
  lastUpdated?: string;
  className?: string;
}

export function OfflineBanner({ lastUpdated, className = '' }: OfflineBannerProps) {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkOnline = () => setIsOffline(!navigator.onLine);
    checkOnline();

    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);

    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, []);

  if (!isOffline) return null;

  const timeStr = lastUpdated || '15 Jan, 08:30 AM';

  return (
    <div
      className={`p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 shadow-xs animate-in fade-in ${className}`}
      role="status"
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="font-bold">{t('offline.badge')}:</span>
        <span>{t('offline.notice', { time: timeStr })}</span>
      </div>
      <span className="text-[10px] uppercase font-semibold tracking-wider opacity-75">
        Cached
      </span>
    </div>
  );
}
