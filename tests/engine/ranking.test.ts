import { describe, it, expect } from 'vitest';
import {
  rankActions,
  filterActions,
  getTopAndWhenYouCan,
  getMemberVulnerability,
  evaluateCondition,
  buildEvaluationContext,
} from '@/lib/engine/ranking';
import { HouseholdProfile, HourlyAir } from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';

describe('Action Ranking and Recommendation Engine', () => {
  const p1Profile = demoSnapshot.profile as HouseholdProfile;
  const p1Hourly = demoSnapshot.hourly as HourlyAir[];

  it('computes member and household vulnerability weights correctly', () => {
    // Child with asthma: max(1.5, 2.0) = 2.0
    const asthmaticChild = p1Profile.members.find((m) => m.id === 'm3')!;
    expect(getMemberVulnerability(asthmaticChild)).toBe(2.0);

    // Senior with heart disease: max(1.3, 2.0) = 2.0
    const seniorHeart = p1Profile.members.find((m) => m.id === 'm4')!;
    expect(getMemberVulnerability(seniorHeart)).toBe(2.0);

    // Healthy adult: 1.0
    const healthyAdult = p1Profile.members.find((m) => m.id === 'm1')!;
    expect(getMemberVulnerability(healthyAdult)).toBe(1.0);
  });

  it('P1 family profile receives highly relevant actions', () => {
    const ranked = rankActions(p1Profile, p1Hourly);
    const { top3 } = getTopAndWhenYouCan(ranked);

    expect(top3).toHaveLength(3);

    // P1 has a purifier with an overdue 14-month filter, asthmatic child, and two-wheeler commuter.
    // Filter replacement should be ranked near top or in top 3.
    const allRankedIds = ranked.slice(0, 5).map((r) => r.action.id);
    expect(allRankedIds).toContain('replace_overdue_filter');

    // N95 respirator should be ranked for two-wheeler commuter
    expect(ranked.some((r) => r.action.id === 'n95_or_ffp2_for_outdoor_commute')).toBe(true);

    // Asthma action review should be applicable
    expect(ranked.some((r) => r.action.id === 'review_asthma_action_plan_with_doctor')).toBe(true);
  });

  it('P2 delivery rider receives commute and personal protection actions', () => {
    const p2Profile: HouseholdProfile = {
      location: p1Profile.location,
      language: 'en',
      units: 'metric',
      home: {
        type: 'studio',
        mainRoomAreaM2: 18,
        ceilingHeightM: 2.5,
        windowLeakiness: 'average',
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
          id: 'rider1',
          nickname: 'Vikas',
          ageBand: 'adult',
          conditions: ['none'],
          commute: {
            mode: 'two_wheeler',
            km: 35,
            startHour: 8,
            endHour: 20,
          },
          outdoorHoursPerDay: 8,
          outdoorActivity: 'physical_work',
          maskOwned: 'cloth',
        },
      ],
      constraints: {
        budgetBand: 'low',
        hasCar: false,
        hasTwoWheeler: true,
      },
    };

    const ranked = rankActions(p2Profile, p1Hourly);
    const topRankedIds = ranked.slice(0, 8).map((r) => r.action.id);

    // Delivery rider on two-wheeler should get N95 recommendation and mask fit inspection
    expect(topRankedIds).toContain('n95_or_ffp2_for_outdoor_commute');
    expect(topRankedIds).toContain('mask_fit_check_and_reuse_limits');
  });

  it('P3 elderly couple with combustion heater strictly triggers CO life-safety rule', () => {
    const p3Profile: HouseholdProfile = {
      location: p1Profile.location,
      language: 'en',
      units: 'metric',
      home: {
        type: 'house',
        mainRoomAreaM2: 40,
        ceilingHeightM: 2.8,
        windowLeakiness: 'leaky',
        canOpenWindows: true,
        renter: false,
        exhaustHood: false,
        ac: 'none',
        heating: ['coal_charcoal'], // Traditional unvented coal brazier (angithi)
        cooking: ['lpg'],
        smokingIndoors: false,
        incenseOrCoils: 'sometimes',
      },
      devices: [],
      members: [
        {
          id: 'senior1',
          nickname: 'Ramesh',
          ageBand: 'senior',
          conditions: ['copd'],
          commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
          outdoorHoursPerDay: 0.5,
          outdoorActivity: 'light',
          maskOwned: 'none',
        },
        {
          id: 'senior2',
          nickname: 'Sita',
          ageBand: 'senior',
          conditions: ['heart'],
          commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
          outdoorHoursPerDay: 0.5,
          outdoorActivity: 'light',
          maskOwned: 'none',
        },
      ],
      constraints: {
        budgetBand: 'low',
        hasCar: false,
        hasTwoWheeler: false,
      },
    };

    const ranked = rankActions(p3Profile, p1Hourly);

    // Rank 1 MUST be the critical safety action: NEVER seal room with combustion heater
    expect(ranked[0].action.id).toBe('never_seal_room_with_combustion_heater');
    expect(ranked[0].why).toContain('LIFE-SAFETY');

    // Install CO alarm must also be in the top recommendations
    const top5Ids = ranked.slice(0, 5).map((r) => r.action.id);
    expect(top5Ids).toContain('install_co_alarm');

    // Dangerous window/door sealing actions MUST NOT be present in eligible actions
    const eligible = filterActions(p3Profile);
    const eligibleIds = eligible.map((a) => a.id);
    expect(eligibleIds).not.toContain('seal_door_and_window_gaps');
    expect(eligibleIds).not.toContain('keep_doors_closed_in_purified_room');
  });

  it('renter does not receive permanent window modification actions', () => {
    const renterProfile: HouseholdProfile = {
      ...p1Profile,
      home: {
        ...p1Profile.home,
        renter: true,
        windowLeakiness: 'leaky',
        heating: ['none'],
      },
    };

    const eligible = filterActions(renterProfile);
    const actionIds = eligible.map((a) => a.id);

    // Permanent weatherstripping action is blocked for renters without removable strip
    expect(actionIds).not.toContain('seal_door_and_window_gaps');

    // Also verify that ranked actions for renters never include seal_door_and_window_gaps
    const rankedRenter = rankActions(renterProfile, p1Hourly);
    const rankedRenterIds = rankedRenter.map((r) => r.action.id);
    expect(rankedRenterIds).not.toContain('seal_door_and_window_gaps');

    // In contrast, an owner with leaky windows CAN receive seal_door_and_window_gaps
    const ownerProfile: HouseholdProfile = {
      ...p1Profile,
      home: {
        ...p1Profile.home,
        renter: false,
        windowLeakiness: 'leaky',
        heating: ['none'],
      },
    };
    const eligibleOwner = filterActions(ownerProfile);
    expect(eligibleOwner.map((a) => a.id)).toContain('seal_door_and_window_gaps');

    // Verify condition evaluator directly
    const renterCtx = buildEvaluationContext(renterProfile, p1Hourly);
    expect(renterCtx.renter).toBe(true);
    expect(evaluateCondition('renter AND NOT removable_weatherstrip', renterCtx)).toBe(true);

    const ownerCtx = buildEvaluationContext(ownerProfile, p1Hourly);
    expect(ownerCtx.renter).toBe(false);
    expect(evaluateCondition('renter AND NOT removable_weatherstrip', ownerCtx)).toBe(false);
  });

  it('enforces diversification: maximum 2 actions per category in top recommendations', () => {
    const ranked = rankActions(p1Profile, p1Hourly);

    // In the first 6 actions, check category distribution
    const first6 = ranked.slice(0, 6);
    const categoryCounts: Record<string, number> = {};

    for (const item of first6) {
      const cat = item.action.category;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      expect(categoryCounts[cat]).toBeLessThanOrEqual(2);
    }
  });

  it('selects exactly Top 3 actions for the day and moves remaining to when you can', () => {
    const ranked = rankActions(p1Profile, p1Hourly);
    const { top3, whenYouCan } = getTopAndWhenYouCan(ranked);

    expect(top3).toHaveLength(3);
    expect(whenYouCan.length).toBeGreaterThan(0);
    expect(ranked.length).toBe(top3.length + whenYouCan.length);

    // Rank numbers should be consecutive starting from 1
    ranked.forEach((item, idx) => {
      expect(item.rank).toBe(idx + 1);
    });
  });
});
