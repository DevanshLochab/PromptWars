'use client';

import React, { useState } from 'react';
import { PlanTimelineEntry, Member } from '@/lib/schemas';
import { Sun, Cloud, Moon, Sunrise, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export interface DayTimelineProps {
  timeline: (PlanTimelineEntry | {
    hour: number;
    aqiBand: string;
    tags: string[];
    advice: string;
    pm25?: number;
    aqi?: number;
    forWhom?: string[];
  })[];
  bestWindows?: { start: number; end: number }[];
  members?: Member[];
  selectedMemberId?: string;
  onSelectHour?: (hour: number) => void;
  className?: string;
}

const BAND_COLORS: Record<string, { dot: string; text: string; bg: string }> = {
  good: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-100' },
  moderate: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-100' },
  'unhealthy-sg': { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-100' },
  'unhealthy-sensitive': { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-100' },
  poor: { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-100' },
  unhealthy: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-100' },
  'very-unhealthy': { dot: 'bg-purple-600', text: 'text-purple-700', bg: 'bg-purple-100' },
  severe: { dot: 'bg-purple-600', text: 'text-purple-700', bg: 'bg-purple-100' },
  hazardous: { dot: 'bg-rose-900', text: 'text-rose-900', bg: 'bg-rose-100' },
};

function formatHourCompact(h: number): string {
  if (h === 0) return '12AM';
  if (h < 12) return `${h}AM`;
  if (h === 12) return '12PM';
  return `${h - 12}PM`;
}

function formatHourSpaced(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function formatVentWindow(windows?: { start: number; end: number }[]): string {
  if (!windows || windows.length === 0) return '1-3 PM';
  const w = windows[0];
  const startFmt = w.start > 12 ? `${w.start - 12}` : `${w.start}`;
  const endFmt = w.end > 12 ? `${w.end - 12} PM` : (w.end === 12 ? '12 PM' : `${w.end} AM`);
  return `${startFmt}-${endFmt}`;
}

function parseActionText(item: { advice: string; tags?: string[] }) {
  const { advice, tags } = item;
  if (!advice) {
    return {
      title: tags?.[0] || 'Air Protection Schedule',
      subtitle: 'Follow baseline protection guidelines.',
    };
  }

  if (advice.includes(':')) {
    const [titlePart, ...rest] = advice.split(':');
    return {
      title: titlePart.trim(),
      subtitle: rest.join(':').trim(),
    };
  }

  if (tags && tags.length > 0 && tags[0]) {
    return {
      title: tags[0],
      subtitle: advice,
    };
  }

  if (advice.includes('.')) {
    const [firstSentence, ...rest] = advice.split('.');
    const remaining = rest.join('.').trim();
    if (remaining) {
      return {
        title: firstSentence.trim(),
        subtitle: remaining.endsWith('.') ? remaining : `${remaining}.`,
      };
    }
  }

  const words = advice.split(' ');
  if (words.length > 4) {
    return {
      title: words.slice(0, 3).join(' '),
      subtitle: advice,
    };
  }

  return {
    title: advice,
    subtitle: 'Maintain clean indoor air protection.',
  };
}

export function DayTimeline({
  timeline,
  bestWindows = [{ start: 13, end: 15 }],
  members = [],
  selectedMemberId = 'all',
  onSelectHour,
  className = '',
}: DayTimelineProps) {
  const { t } = useTranslation();
  // Local state for checkboxes
  const [doneHours, setDoneHours] = useState<Record<number, boolean>>({});

  const toggleDone = (hour: number) => {
    setDoneHours((prev) => ({ ...prev, [hour]: !prev[hour] }));
  };

  const isBestWindow = (h: number) =>
    bestWindows.some((w) => h >= w.start && h <= w.end);

  const getTargetMembers = (
    hour: number,
    tags: string[],
    advice: string
  ): Member[] => {
    if (!members || members.length === 0) return [];

    if (selectedMemberId && selectedMemberId !== 'all') {
      const found = members.find((m) => m.id === selectedMemberId);
      return found ? [found] : [];
    }

    // Check if advice or tags mentions specific member nickname
    const matched = members.filter((m) => {
      const nameLower = m.nickname.toLowerCase();
      return (
        advice.toLowerCase().includes(nameLower) ||
        tags.some((t) => t.toLowerCase().includes(nameLower))
      );
    });
    if (matched.length > 0) return matched;

    // Check commute
    const commuters = members.filter(
      (m) =>
        m.commute &&
        m.commute.mode !== 'none' &&
        m.commute.startHour !== undefined &&
        hour >= m.commute.startHour &&
        hour <= (m.commute.endHour || m.commute.startHour + 1)
    );
    if (commuters.length > 0) return commuters;

    // Peak smog hours: vulnerable members
    if ((hour >= 7 && hour <= 10) || (hour >= 18 && hour <= 21)) {
      const vulnerable = members.filter(
        (m) =>
          m.conditions.some((c) => c !== 'none') ||
          ['infant', 'toddler', 'child', 'senior'].includes(m.ageBand)
      );
      if (vulnerable.length > 0) return vulnerable;
    }

    // Default: household level (all members)
    return members;
  };

  const isHourRelevantForMember = (
    item: { hour: number; tags: string[]; advice: string },
    memberId: string
  ): boolean => {
    if (memberId === 'all') return true;
    const member = members.find((m) => m.id === memberId);
    if (!member) return true;

    // Nickname match
    const nameLower = member.nickname.toLowerCase();
    if (
      item.advice.toLowerCase().includes(nameLower) ||
      item.tags.some((t) => t.toLowerCase().includes(nameLower))
    ) {
      return true;
    }

    // Commute match
    if (
      member.commute &&
      member.commute.mode !== 'none' &&
      member.commute.startHour !== undefined
    ) {
      const endH = member.commute.endHour || member.commute.startHour + 1;
      if (item.hour >= member.commute.startHour && item.hour <= endH) {
        return true;
      }
    }

    // Peak smog vulnerability
    const isVulnerable =
      member.conditions.some((c) => c !== 'none') ||
      ['infant', 'toddler', 'child', 'senior'].includes(member.ageBand);
    if (
      isVulnerable &&
      ((item.hour >= 7 && item.hour <= 10) || (item.hour >= 18 && item.hour <= 21))
    ) {
      return true;
    }

    // Ventilation window (relevant for everyone at home)
    if (isBestWindow(item.hour)) {
      return true;
    }

    // Sleep hours (bedroom air purifier)
    if (item.hour >= 22 || item.hour <= 6) {
      return true;
    }

    return false;
  };

  // Section definitions
  // 🌅 Morning (5–11): hours 5..10
  // ☀️ Afternoon (11–17): hours 11..16
  // 🌆 Evening (17–21): hours 17..20
  // 🌙 Night (21–5): hours 21, 22, 23, 0, 1, 2, 3, 4
  const sections = [
    {
      id: 'morning',
      title: t('air.morning') || 'Morning',
      range: '5 AM – 11 AM',
      icon: Sunrise,
      iconColor: 'text-amber-500',
      hours: [5, 6, 7, 8, 9, 10],
    },
    {
      id: 'afternoon',
      title: t('air.afternoon') || 'Afternoon',
      range: '11 AM – 5 PM',
      icon: Sun,
      iconColor: 'text-amber-500',
      hours: [11, 12, 13, 14, 15, 16],
    },
    {
      id: 'evening',
      title: t('air.evening') || 'Evening',
      range: '5 PM – 9 PM',
      icon: Cloud,
      iconColor: 'text-sky-500',
      hours: [17, 18, 19, 20],
    },
    {
      id: 'night',
      title: t('air.night') || 'Night',
      range: '9 PM – 5 AM',
      icon: Moon,
      iconColor: 'text-indigo-400',
      hours: [21, 22, 23, 0, 1, 2, 3, 4],
    },
  ];

  return (
    <div
      role="region"
      aria-label="24-Hour Day Timeline"
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4 shadow-xs ${className}`}
    >
      {/* Timeline Header & Best Window Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{t('air.timeline_title') || '24-Hour Action Timeline'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('air.timeline_sub') || 'Diurnal rhythm calibrated for your local air forecast'}
          </p>
        </div>

        {/* Ventilation Window Badge */}
        {bestWindows && bestWindows.length > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
            <span>🪟</span>
            <span>{t('air.ventilate_window_badge', { window: formatVentWindow(bestWindows) }) || `Ventilate Window (${formatVentWindow(bestWindows)})`}</span>
          </div>
        )}
      </div>

      {/* 4 Grouped Sections */}
      <div className="space-y-5">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          const sectionTimeline = section.hours
            .map((h) => timeline.find((t) => t.hour === h))
            .filter((item): item is NonNullable<typeof item> => Boolean(item));

          const filteredItems = sectionTimeline.filter((item) =>
            isHourRelevantForMember(item, selectedMemberId)
          );

          // If filtering hides all items in this section, show a brief note
          if (filteredItems.length === 0 && selectedMemberId !== 'all') {
            return (
              <div key={section.id} className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 pb-1.5">
                  <SectionIcon className={`w-4 h-4 ${section.iconColor}`} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {section.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    ({section.range})
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 italic pl-6">
                  {t('air.no_interventions') || 'No specific interventions required during this window.'}
                </p>
              </div>
            );
          }

          if (filteredItems.length === 0) return null;

          return (
            <div
              key={section.id}
              className="pt-3 border-t border-slate-100 dark:border-slate-800 first:border-t-0 first:pt-0"
            >
              {/* Section Header */}
              <div className="flex items-center gap-2 pb-2">
                <SectionIcon className={`w-4 h-4 ${section.iconColor}`} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {section.title}
                </h4>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  ({section.range})
                </span>
              </div>

              {/* Items in section */}
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const bandKey = item.aqiBand.toLowerCase();
                  const bandMeta = BAND_COLORS[bandKey] || {
                    dot: 'bg-slate-400',
                    text: 'text-slate-600',
                    bg: 'bg-slate-100',
                  };
                  const parsed = parseActionText(item);
                  const isDone = Boolean(doneHours[item.hour]);
                  const inVentWindow = isBestWindow(item.hour);
                  const targetMembers = getTargetMembers(
                    item.hour,
                    item.tags || [],
                    item.advice
                  );

                  return (
                    <div
                      key={item.hour}
                      onClick={() => onSelectHour?.(item.hour)}
                      className={`flex items-start gap-3 py-2.5 px-2 rounded-xl transition-colors ${
                        isDone
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                          : inVentWindow
                          ? 'bg-emerald-50/20 dark:bg-emerald-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox: tap to mark done (local state) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDone(item.hour);
                        }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer focus:outline-hidden ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 bg-white dark:bg-slate-800'
                        }`}
                        aria-label={`Mark hour ${item.hour} done`}
                        aria-pressed={isDone}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Hour Label (left column, fixed width) */}
                      <div className="w-16 shrink-0 flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {/* Compact label for SSR test string matching */}
                          <span className="sr-only">
                            {formatHourCompact(item.hour)}
                          </span>
                          <span aria-hidden="true">
                            {formatHourSpaced(item.hour)}
                          </span>
                        </span>
                        {/* AQI Color Dot */}
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${bandMeta.dot}`}
                          title={`AQI: ${item.aqiBand}`}
                        />
                      </div>

                      {/* Action Text: Bold short title + light subtitle */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug ${
                              isDone
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : ''
                            }`}
                          >
                            {parsed.title}
                          </span>
                          {inVentWindow && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Ventilate
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-normal ${
                            isDone
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : ''
                          }`}
                        >
                          {parsed.subtitle}
                        </p>
                      </div>

                      {/* For Whom: Small Avatar Initial Chips */}
                      {targetMembers.length > 0 && (
                        <div className="flex items-center -space-x-1 shrink-0 mt-0.5">
                          {targetMembers.slice(0, 3).map((m) => (
                            <span
                              key={m.id}
                              title={m.nickname}
                              className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-white dark:border-slate-900 shadow-2xs"
                            >
                              {m.nickname.charAt(0).toUpperCase()}
                            </span>
                          ))}
                          {targetMembers.length > 3 && (
                            <span className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-white dark:border-slate-900">
                              +{targetMembers.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DayTimeline;
