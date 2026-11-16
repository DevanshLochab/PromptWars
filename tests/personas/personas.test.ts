import { describe, it, expect } from 'vitest';
import { generateFallbackPlan } from '@/lib/gemini/fallback';
import { rankActions } from '@/lib/engine/ranking';
import { PlanSchema, HouseholdProfile, HourlyAir } from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';

// P1: Family of four
const P1: HouseholdProfile = {
  location: { lat: 28.6139, lon: 77.209, placeName: 'New Delhi', timezone: 'Asia/Kolkata' },
  language: 'en',
  units: 'metric',
  home: {
    type: 'apartment',
    mainRoomAreaM2: 30,
    ceilingHeightM: 2.7,
    windowLeakiness: 'leaky',
    canOpenWindows: true,
    renter: false,
    exhaustHood: false,
    ac: 'none',
    heating: ['none'],
    cooking: ['lpg'],
    smokingIndoors: false,
    incenseOrCoils: 'never',
  },
  devices: [{ type: 'purifier', cadrM3h: 250, filterAgeMonths: 14 }],
  members: [
    {
      id: 'child',
      nickname: 'Aarav',
      ageBand: 'child',
      conditions: ['asthma'],
      commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
      outdoorHoursPerDay: 2,
      outdoorActivity: 'light',
      maskOwned: 'none',
    },
    {
      id: 'grandpa',
      nickname: 'Dadaji',
      ageBand: 'senior',
      conditions: ['heart'],
      commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
      outdoorHoursPerDay: 1,
      outdoorActivity: 'none',
      maskOwned: 'none',
    },
    {
      id: 'father',
      nickname: 'Papa',
      ageBand: 'adult',
      conditions: ['none'],
      commute: { mode: 'two_wheeler', km: 12, startHour: 9, endHour: 18 },
      outdoorHoursPerDay: 2,
      outdoorActivity: 'none',
      maskOwned: 'none',
    },
    {
      id: 'mother',
      nickname: 'Maa',
      ageBand: 'adult',
      conditions: ['none'],
      commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
      outdoorHoursPerDay: 0.5,
      outdoorActivity: 'none',
      maskOwned: 'none',
    },
  ],
  constraints: { budgetBand: 'medium', hasCar: false, hasTwoWheeler: true },
};

// P2: Delivery rider
const P2: HouseholdProfile = {
  location: { lat: 28.6139, lon: 77.209, placeName: 'New Delhi', timezone: 'Asia/Kolkata' },
  language: 'en',
  units: 'metric',
  home: {
    type: 'apartment',
    mainRoomAreaM2: 15,
    ceilingHeightM: 2.7,
    windowLeakiness: 'leaky',
    canOpenWindows: true,
    renter: true,
    exhaustHood: false,
    ac: 'none',
    heating: ['none'],
    cooking: ['lpg'],
    smokingIndoors: false,
    incenseOrCoils: 'never',
  },
  devices: [],
  members: [
    {
      id: 'rider',
      nickname: 'Raju',
      ageBand: 'adult',
      conditions: ['none'],
      commute: { mode: 'two_wheeler', km: 80, startHour: 8, endHour: 20 },
      outdoorHoursPerDay: 8,
      outdoorActivity: 'physical_work',
      maskOwned: 'cloth',
    },
  ],
  constraints: { budgetBand: 'low', hasCar: false, hasTwoWheeler: true },
};

// P3: Elderly couple with coal heater — MUST trigger CO rule
const P3: HouseholdProfile = {
  location: { lat: 28.6139, lon: 77.209, placeName: 'New Delhi', timezone: 'Asia/Kolkata' },
  language: 'en',
  units: 'metric',
  home: {
    type: 'apartment',
    mainRoomAreaM2: 25,
    ceilingHeightM: 2.7,
    windowLeakiness: 'average',
    canOpenWindows: true,
    renter: false,
    exhaustHood: false,
    ac: 'none',
    heating: ['coal_charcoal'],
    cooking: ['lpg'],
    smokingIndoors: false,
    incenseOrCoils: 'never',
  },
  devices: [],
  members: [
    {
      id: 'grandma',
      nickname: 'Dadi',
      ageBand: 'senior',
      conditions: ['heart'],
      commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
      outdoorHoursPerDay: 0.5,
      outdoorActivity: 'none',
      maskOwned: 'none',
    },
    {
      id: 'grandpa',
      nickname: 'Dada',
      ageBand: 'senior',
      conditions: ['copd'],
      commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
      outdoorHoursPerDay: 0.5,
      outdoorActivity: 'none',
      maskOwned: 'none',
    },
  ],
  constraints: { budgetBand: 'low', hasCar: false, hasTwoWheeler: false },
};

// P4: Pregnant professional, renter, no purifier
const P4: HouseholdProfile = {
  location: { lat: 28.6139, lon: 77.209, placeName: 'New Delhi', timezone: 'Asia/Kolkata' },
  language: 'en',
  units: 'metric',
  home: {
    type: 'apartment',
    mainRoomAreaM2: 35,
    ceilingHeightM: 2.7,
    windowLeakiness: 'average',
    canOpenWindows: true,
    renter: true,
    exhaustHood: false,
    ac: 'split',
    heating: ['none'],
    cooking: ['lpg'],
    smokingIndoors: false,
    incenseOrCoils: 'never',
  },
  devices: [],
  members: [
    {
      id: 'priya',
      nickname: 'Priya',
      ageBand: 'adult',
      conditions: ['pregnant'],
      commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
      outdoorHoursPerDay: 1,
      outdoorActivity: 'none',
      maskOwned: 'surgical',
    },
  ],
  constraints: { budgetBand: 'medium', hasCar: false, hasTwoWheeler: false },
};

// P5: Housing society
const P5: HouseholdProfile = {
  location: { lat: 28.6139, lon: 77.209, placeName: 'New Delhi', timezone: 'Asia/Kolkata' },
  language: 'en',
  units: 'metric',
  home: {
    type: 'house',
    mainRoomAreaM2: 50,
    ceilingHeightM: 3.0,
    windowLeakiness: 'average',
    canOpenWindows: true,
    renter: false,
    exhaustHood: true,
    ac: 'split',
    heating: ['none'],
    cooking: ['lpg'],
    smokingIndoors: false,
    incenseOrCoils: 'never',
  },
  devices: [{ type: 'purifier', cadrM3h: 400, filterAgeMonths: 3 }],
  members: [
    {
      id: 'rep',
      nickname: 'Society Rep',
      ageBand: 'adult',
      conditions: ['none'],
      commute: { mode: 'car', km: 5, startHour: 8, endHour: 17 },
      outdoorHoursPerDay: 1,
      outdoorActivity: 'none',
      maskOwned: 'n95',
    },
  ],
  constraints: { budgetBand: 'high', hasCar: true, hasTwoWheeler: false },
  communityCode: 'DELHI-GREEN-01',
};

const airData = demoSnapshot.hourly as unknown as HourlyAir[];

describe('Persona Tests', () => {
  it('P1 family of four produces valid plan', () => {
    const plan = generateFallbackPlan(P1, airData, undefined, 'en');
    expect(PlanSchema.safeParse(plan).success).toBe(true);
    expect(plan.topActions.length).toBeGreaterThan(0);
    expect(plan.topActions.length).toBeLessThanOrEqual(3);
    expect(plan.timeline).toHaveLength(24);
    expect(plan.perMember).toHaveLength(4);
  });

  it('P2 delivery rider produces valid plan', () => {
    const plan = generateFallbackPlan(P2, airData, undefined, 'en');
    expect(PlanSchema.safeParse(plan).success).toBe(true);
    expect(plan.topActions.length).toBeGreaterThan(0);
    expect(plan.topActions.length).toBeLessThanOrEqual(3);
    expect(plan.perMember).toHaveLength(1);
  });

  it('P3 elderly couple triggers CO rule', () => {
    const plan = generateFallbackPlan(P3, airData, undefined, 'en');
    expect(PlanSchema.safeParse(plan).success).toBe(true);
    const allText = JSON.stringify(plan).toLowerCase();
    expect(allText).toContain('carbon monoxide');

    // Also verify ranking puts CO safety first
    const ranked = rankActions(P3, airData);
    expect(ranked[0].action.id).toBe('never_seal_room_with_combustion_heater');
    expect(ranked.some((r) => r.action.id === 'install_co_alarm')).toBe(true);
  });

  it('P4 pregnant renter produces valid plan', () => {
    const plan = generateFallbackPlan(P4, airData, undefined, 'en');
    expect(PlanSchema.safeParse(plan).success).toBe(true);
    expect(plan.topActions.length).toBeGreaterThan(0);
  });

  it('P4 renter never gets modify-windows actions', () => {
    const plan = generateFallbackPlan(P4, airData, undefined, 'en');
    const actionIds = plan.topActions.map((a) => a.receiptId);
    expect(actionIds.every((id) => !id.includes('seal_door_and_window_gaps'))).toBe(true);

    const ranked = rankActions(P4, airData);
    const rankedIds = ranked.map((r) => r.action.id);
    expect(rankedIds).not.toContain('seal_door_and_window_gaps');
  });

  it('P5 housing society produces valid plan', () => {
    const plan = generateFallbackPlan(P5, airData, undefined, 'en');
    expect(PlanSchema.safeParse(plan).success).toBe(true);
    expect(plan.topActions.length).toBeGreaterThan(0);
  });

  it('No infant/toddler gets tight respirator recommendation', () => {
    const profileWithInfant: HouseholdProfile = {
      ...P1,
      members: [
        ...P1.members,
        {
          id: 'baby',
          nickname: 'Baby',
          ageBand: 'infant',
          conditions: ['none'],
          commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
          outdoorHoursPerDay: 0,
          outdoorActivity: 'none',
          maskOwned: 'none',
        },
      ],
    };
    const plan = generateFallbackPlan(profileWithInfant, airData, undefined, 'en');
    const infantTips = plan.perMember?.find((m) => m.memberId === 'baby');
    expect(infantTips).toBeDefined();
    if (infantTips) {
      const tipsText = infantTips.tips.join(' ').toLowerCase();
      // Should explicitly warn against tight respirators or suffocation, NOT recommend wearing one
      expect(tipsText).not.toContain('wear a well-fitted n95');
      expect(tipsText).not.toContain('wear an n95');
      expect(tipsText).toContain('do not use tight respirators');
    }
  });
});
