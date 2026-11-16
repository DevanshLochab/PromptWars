import { describe, it, expect } from 'vitest';
import { generateFallbackPlan } from '@/lib/gemini/fallback';
import { HouseholdProfile, HourlyAir, PlanSchema } from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';

describe('Gemini Deterministic Fallback Plan Generator', () => {
  const profile = demoSnapshot.profile as HouseholdProfile;
  const hourlyAir = demoSnapshot.hourly as HourlyAir[];

  it('generates a complete valid Plan conforming to PlanSchema without API key', () => {
    const plan = generateFallbackPlan(profile);
    const parsed = PlanSchema.safeParse(plan);

    expect(parsed.success).toBe(true);
    expect(plan.topActions.length).toBeGreaterThan(0);
    expect(plan.topActions.length).toBeLessThanOrEqual(3);
    expect(plan.timeline).toHaveLength(24);
    expect(plan.perMember.length).toBe(profile.members.length);
    expect(plan.headline).toContain('AI personalization unavailable');
    expect(plan.safetyNotes.length).toBeGreaterThan(0);
    expect(plan.citations.length).toBeGreaterThan(0);
  });

  it('thoroughly verifies structural completeness and fields of fallback plan', () => {
    const plan = generateFallbackPlan(profile, hourlyAir, undefined, 'en');

    // 1. Valid timestamp and severity
    expect(new Date(plan.generatedAt).getTime()).not.toBeNaN();
    expect(plan.severityTier).toBeDefined();
    expect(typeof plan.severityTier).toBe('string');
    expect(plan.language).toBe('en');

    // 2. 24-hour timeline entries validation
    expect(plan.timeline).toHaveLength(24);
    plan.timeline.forEach((entry, idx) => {
      expect(entry.hour).toBe(idx);
      expect(entry.aqiBand).toBeTruthy();
      expect(Array.isArray(entry.tags)).toBe(true);
      expect(typeof entry.advice).toBe('string');
      expect(entry.advice.trim().length).toBeGreaterThan(5);
    });

    // 3. Top actions completeness
    expect(plan.topActions.length).toBeGreaterThanOrEqual(1);
    expect(plan.topActions.length).toBeLessThanOrEqual(3);
    for (const action of plan.topActions) {
      expect(action.receiptId).toBeTruthy();
      expect(action.why.trim().length).toBeGreaterThan(5);
      expect(action.how.trim().length).toBeGreaterThan(5);
      expect(action.whenWindow.trim().length).toBeGreaterThan(0);
      expect(action.forWhom.trim().length).toBeGreaterThan(0);
    }

    // 4. Per-member tips completeness
    expect(plan.perMember).toHaveLength(profile.members.length);
    for (const memberTip of plan.perMember) {
      expect(memberTip.memberId).toBeTruthy();
      expect(memberTip.nickname).toBeTruthy();
      expect(memberTip.tips.length).toBeGreaterThan(0);
      for (const tip of memberTip.tips) {
        expect(tip.trim().length).toBeGreaterThan(5);
      }
    }

    // 5. Safety notes & medical disclaimer
    expect(plan.safetyNotes.length).toBeGreaterThan(0);
    const disclaimerFound = plan.safetyNotes.some(
      (note) =>
        note.toLowerCase().includes('not medical') ||
        note.toLowerCase().includes('clinical treatment') ||
        note.toLowerCase().includes('medical diagnosis')
    );
    expect(disclaimerFound).toBe(true);

    // 6. Citations
    expect(plan.citations.length).toBeGreaterThanOrEqual(2);
    for (const citation of plan.citations) {
      expect(citation.title).toBeTruthy();
      expect(citation.url).toMatch(/^https?:\/\//);
    }
  });

  it('triggers CO warning and safety notes for profiles with combustion heating', () => {
    const combustionProfile: HouseholdProfile = {
      ...profile,
      home: {
        ...profile.home,
        heating: ['coal_charcoal'],
      },
    };

    const plan = generateFallbackPlan(combustionProfile, hourlyAir, undefined, 'en');

    // CO rule must be present in safety notes
    const coNote = plan.safetyNotes.find((n) =>
      n.toLowerCase().includes('carbon monoxide')
    );
    expect(coNote).toBeDefined();
    expect(coNote?.toLowerCase()).toContain('never seal the room');

    // Timeline entries should reflect CO safety
    const coTimeline = plan.timeline.filter((t) =>
      t.tags.includes('CO Safety')
    );
    expect(coTimeline.length).toBeGreaterThan(0);
  });

  it('protects vulnerable infants by advising against tight respirators', () => {
    const infantProfile: HouseholdProfile = {
      ...profile,
      members: [
        {
          id: 'infant_1',
          nickname: 'Anaya',
          ageBand: 'infant',
          conditions: ['none'],
          commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
          outdoorHoursPerDay: 0,
          outdoorActivity: 'none',
          maskOwned: 'none',
        },
      ],
    };

    const plan = generateFallbackPlan(infantProfile, hourlyAir, undefined, 'en');
    const infantTips = plan.perMember.find((m) => m.memberId === 'infant_1');
    expect(infantTips).toBeDefined();

    const joinedTips = infantTips!.tips.join(' ').toLowerCase();
    expect(joinedTips).toContain('do not use tight respirators');
    expect(joinedTips).toContain('suffocation');
    expect(joinedTips).not.toContain('wear a well-fitted n95');
  });

  it('generates a valid plan in Hindi when language is "hi"', () => {
    const hiProfile: HouseholdProfile = {
      ...profile,
      language: 'hi',
    };

    const plan = generateFallbackPlan(hiProfile, undefined, undefined, 'hi');
    const parsed = PlanSchema.safeParse(plan);

    expect(parsed.success).toBe(true);
    expect(plan.language).toBe('hi');
    expect(plan.headline).toContain('AI वैयक्तिकरण अनुपलब्ध');
    expect(plan.timeline).toHaveLength(24);
    expect(plan.topActions.length).toBeGreaterThan(0);
    expect(plan.safetyNotes.length).toBeGreaterThan(0);

    // Hindi medical disclaimer check
    const hindiDisclaimer = plan.safetyNotes.some((n) =>
      n.includes('चिकित्सा निदान या उपचार')
    );
    expect(hindiDisclaimer).toBe(true);
  });
});
