import { describe, it, expect } from 'vitest';
import { generateFallbackPlan } from '@/lib/gemini/fallback';
import { HouseholdProfile } from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';

describe('Life Safety Rails & Constraints Verification', () => {
  // P3 Profile: Coal/Charcoal heating
  const p3Profile: HouseholdProfile = {
    ...(demoSnapshot.profile as HouseholdProfile),
    home: {
      ...(demoSnapshot.profile as HouseholdProfile).home,
      heating: ['coal_charcoal'],
    },
  };

  it('unconditionally includes Carbon Monoxide (CO) warning when combustion heating is present', () => {
    const plan = generateFallbackPlan(p3Profile);

    // Verify in safety notes
    const hasCoSafetyNote = plan.safetyNotes.some(
      (note) =>
        note.toLowerCase().includes('carbon monoxide') ||
        note.toLowerCase().includes('co warning') ||
        note.toLowerCase().includes('कार्बन मोनोऑक्साइड')
    );
    expect(hasCoSafetyNote).toBe(true);

    // Verify top action or advice emphasizes never sealing the room
    const hasVentilationOrCo =
      plan.topActions.some((a) =>
        a.why.toLowerCase().includes('carbon monoxide') ||
        a.why.toLowerCase().includes('combustion') ||
        a.how.toLowerCase().includes('window cracked')
      ) ||
      plan.timeline.some((t) =>
        t.advice.toLowerCase().includes('combustion') ||
        t.advice.toLowerCase().includes('cracked') ||
        t.advice.toLowerCase().includes('co safety')
      );
    expect(hasVentilationOrCo).toBe(true);
  });

  it('never recommends tight respirators or N95 masks for infants or toddlers under 2', () => {
    const infantProfile: HouseholdProfile = {
      ...(demoSnapshot.profile as HouseholdProfile),
      members: [
        {
          id: 'infant_1',
          nickname: 'Baby Aarav',
          ageBand: 'infant',
          conditions: ['none'],
          commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
          outdoorHoursPerDay: 0.5,
          outdoorActivity: 'none',
          maskOwned: 'none',
        },
      ],
    };

    const plan = generateFallbackPlan(infantProfile);
    const babyTips = plan.perMember.find((pm) => pm.memberId === 'infant_1')?.tips || [];

    expect(babyTips.length).toBeGreaterThan(0);

    // Verify it warns AGAINST tight respirators / N95
    const text = babyTips.join(' ');
    expect(text.toLowerCase()).toContain('do not use tight respirators');
    expect(text.toLowerCase()).toContain('suffocation hazard');
  });
});
