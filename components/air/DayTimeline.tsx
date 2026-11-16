'use client';

import React, { useState } from 'react';
import { PlanTimelineEntry } from '@/lib/schemas';

export interface DayTimelineProps {
  timeline: PlanTimelineEntry[] | ({
    hour: number;
    aqiBand: string;
    tags: string[];
    advice: string;
    pm25?: number;
    aqi?: number;
  })[];
  bestWindows?: { start: number; end: number }[];
  onSelectHour?: (hour: number) => void;
  className?: string;
}

const BAND_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  good: { bg: 'bg-emerald-500', text: 'text-emerald-700', hex: '#10b981' },
  moderate: { bg: 'bg-amber-500', text: 'text-amber-700', hex: '#f59e0b' },
  'unhealthy-sg': { bg: 'bg-orange-500', text: 'text-orange-700', hex: '#f97316' },
  'unhealthy-sensitive': { bg: 'bg-orange-500', text: 'text-orange-700', hex: '#f97316' },
  poor: { bg: 'bg-orange-500', text: 'text-orange-700', hex: '#f97316' },
  unhealthy: { bg: 'bg-red-500', text: 'text-red-700', hex: '#ef4444' },
  'very-unhealthy': { bg: 'bg-purple-500', text: 'text-purple-700', hex: '#8b5cf6' },
  severe: { bg: 'bg-purple-500', text: 'text-purple-700', hex: '#8b5cf6' },
  hazardous: { bg: 'bg-rose-950', text: 'text-rose-900', hex: '#7f1d1d' },
};

function formatHour(h: number): string {
  if (h === 0) return '12AM';
  if (h < 12) return `${h}AM`;
  if (h === 12) return '12PM';
  return `${h - 12}PM`;
}

export function DayTimeline({
  timeline,
  bestWindows = [{ start: 13, end: 15 }],
  onSelectHour,
  className = '',
}: DayTimelineProps) {
  const [selectedHour, setSelectedHour] = useState<number>(13);

  // Check if an hour falls in any bestWindow
  const isBestWindow = (h: number) =>
    bestWindows.some((w) => h >= w.start && h <= w.end);

  const selectedItem =
    timeline.find((t) => t.hour === selectedHour) || timeline[0];

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour);
    if (onSelectHour) {
      onSelectHour(hour);
    }
  };

  return (
    <div
      role="region"
      aria-label="24-Hour Air Quality and Ventilation Timeline"
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4 shadow-sm ${className}`}
    >
      {/* Timeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>🕒</span>
            <span>24-Hour Air Quality Forecast & Windows</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hourly diurnal inversion cycle. Tap any hour bar to view personalized advice.
          </p>
        </div>

        {/* Legend / Best Window indicator */}
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
            <span>🪟</span>
            <span>Ventilate Window (1-3 PM)</span>
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Bar Strip */}
      <div className="overflow-x-auto pb-3 pt-4 scrollbar-thin">
        <div className="min-w-[680px] flex items-end gap-1.5 px-1 h-36">
          {timeline.map((item) => {
            const inWindow = isBestWindow(item.hour);
            const isSelected = item.hour === selectedHour;
            const bandKey = item.aqiBand.toLowerCase();
            const colorMeta = BAND_COLORS[bandKey] || {
              bg: 'bg-slate-400',
              text: 'text-slate-600',
              hex: '#64748b',
            };

            // Height representation: default max 80px, minimum 20px
            const barHeight = inWindow ? 34 : Math.min(85, Math.max(28, 40 + (item.hour % 6) * 7));

            return (
              <button
                key={item.hour}
                type="button"
                onClick={() => handleHourClick(item.hour)}
                aria-label={`${formatHour(item.hour)}: ${item.aqiBand} air quality. ${item.advice}`}
                className={`flex-1 min-w-[26px] flex flex-col items-center justify-end group cursor-pointer focus:outline-hidden relative p-1 rounded-lg transition-all ${
                  isSelected
                    ? 'ring-2 ring-sky-500 dark:ring-sky-400 bg-sky-50/50 dark:bg-sky-950/40'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Best Window Pill Flag */}
                {inWindow && item.hour === bestWindows[0]?.start && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white shadow-xs">
                    🪟 Ventilate
                  </span>
                )}

                {/* Tag Dots (e.g. school run, cook) */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-0.5 mb-1.5">
                    {item.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        title={tag}
                        className="w-1.5 h-1.5 rounded-full bg-slate-700 dark:bg-slate-300"
                      />
                    ))}
                  </div>
                )}

                {/* Colored AQI Bar */}
                <div
                  className={`w-full rounded-md transition-all duration-200 ${
                    colorMeta.bg
                  } ${
                    inWindow
                      ? 'ring-2 ring-emerald-400 dark:ring-emerald-500 shadow-sm'
                      : ''
                  } ${isSelected ? 'opacity-100 scale-105' : 'opacity-85 group-hover:opacity-100'}`}
                  style={{ height: `${barHeight}px` }}
                />

                {/* Hour Label */}
                <span
                  className={`mt-2 text-[10px] font-semibold whitespace-nowrap ${
                    isSelected
                      ? 'text-sky-600 dark:text-sky-400 font-extrabold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {formatHour(item.hour)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Hour Detail Card */}
      {selectedItem && (
        <div className="rounded-xl p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                ⏰ {formatHour(selectedItem.hour)}:00
              </span>
              <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                {selectedItem.aqiBand}
              </span>
              {isBestWindow(selectedItem.hour) && (
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  🪟 Recommended Natural Flush Window
                </span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {selectedItem.advice}
            </p>
          </div>

          {selectedItem.tags && selectedItem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {selectedItem.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs"
                >
                  🏷️ {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DayTimeline;
