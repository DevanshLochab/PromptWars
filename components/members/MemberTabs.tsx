'use client';

import React from 'react';
import { Member, AgeBandEnum, HealthConditionEnum } from '@/lib/schemas';
import { z } from 'zod';

export type AgeBand = z.infer<typeof AgeBandEnum>;
export type HealthCondition = z.infer<typeof HealthConditionEnum>;

export interface MemberTabsProps {
  members: Member[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

const AGE_ICONS: Record<string, string> = {
  infant: '👶',
  toddler: '🧒',
  child: '👦',
  teen: '🧑‍🦱',
  adult: '🧑',
  senior: '👴',
};

const CONDITION_ICONS: Record<string, { icon: string; label: string }> = {
  asthma: { icon: '🫁', label: 'Asthma (High Respiratory Vulnerability)' },
  copd: { icon: '🫁', label: 'COPD' },
  heart: { icon: '❤️', label: 'Cardiovascular Risk' },
  pregnant: { icon: '🤰', label: 'Pregnancy' },
  diabetes: { icon: '🩸', label: 'Metabolic Risk' },
  none: { icon: '', label: '' },
};

export function MemberTabs({
  members,
  activeId,
  onChange,
  className = '',
}: MemberTabsProps) {
  if (!members || members.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Household Members ({members.length})
        </span>
        <span>Select member for personalized risk profile</span>
      </div>

      <div
        role="tablist"
        aria-label="Household family members"
        className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin"
      >
        {members.map((member) => {
          const isActive = member.id === activeId;
          const ageIcon = AGE_ICONS[member.ageBand] || '🧑';

          // Extract active condition icons
          const activeConditions = member.conditions.filter(
            (c) => c !== 'none' && CONDITION_ICONS[c]?.icon
          );

          return (
            <button
              key={member.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`member-panel-${member.id}`}
              id={`member-tab-${member.id}`}
              type="button"
              onClick={() => onChange(member.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] shrink-0 border focus:outline-hidden focus:ring-2 focus:ring-sky-400 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="text-base select-none" aria-hidden="true">
                {ageIcon}
              </span>

              <span>{member.nickname}</span>

              {/* Badges for health risks */}
              {activeConditions.length > 0 && (
                <div className="flex items-center gap-0.5 ml-1">
                  {activeConditions.map((c, i) => (
                    <span
                      key={i}
                      title={CONDITION_ICONS[c]?.label}
                      className="text-xs"
                      aria-label={CONDITION_ICONS[c]?.label}
                    >
                      {CONDITION_ICONS[c]?.icon}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MemberTabs;
