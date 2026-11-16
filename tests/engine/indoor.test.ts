import { describe, it, expect } from 'vitest';
import {
  computeSteadyState,
  computeHourlyIndoor,
  getEffectiveCADR,
  getIndoorSources,
} from '@/lib/engine/indoor';
import { HouseholdProfile } from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';

describe('Indoor PM2.5 Model', () => {
  it('REQUIRED: computes baseline steady state without purifier (≈171.4 µg/m³)', () => {
    // P=0.8, a=0.5, k=0.2, C_out=300, V=80, Q=0, S=0 → C_in ≈ 171.43 µg/m³
    const cIn = computeSteadyState({
      cOut: 300,
      P: 0.8,
      a: 0.5,
      k: 0.2,
      S: 0,
      V: 80,
      Q: 0,
    });
    expect(cIn).toBeCloseTo(171.43, 1);
  });

  it('REQUIRED: computes steady state with CADR 300 m³/h purifier (≈27.0 µg/m³, ~84% reduction)', () => {
    // P=0.8, a=0.5, k=0.2, C_out=300, V=80, Q=300, S=0 → C_in ≈ 26.97 µg/m³
    const cInBaseline = computeSteadyState({
      cOut: 300,
      P: 0.8,
      a: 0.5,
      k: 0.2,
      S: 0,
      V: 80,
      Q: 0,
    });

    const cInPurified = computeSteadyState({
      cOut: 300,
      P: 0.8,
      a: 0.5,
      k: 0.2,
      S: 0,
      V: 80,
      Q: 300,
    });

    expect(cInPurified).toBeCloseTo(26.97, 1);

    const reductionPct = ((cInBaseline - cInPurified) / cInBaseline) * 100;
    expect(reductionPct).toBeCloseTo(84.26, 0);
  });

  it('calculates elevated steady state with indoor sources (S > 0)', () => {
    const cClean = computeSteadyState({
      cOut: 300,
      P: 0.8,
      a: 0.5,
      k: 0.2,
      S: 0,
      V: 80,
      Q: 0,
    });

    // Cooking emission S = 2000 µg/h (LPG)
    const cCooking = computeSteadyState({
      cOut: 300,
      P: 0.8,
      a: 0.5,
      k: 0.2,
      S: 2000,
      V: 80,
      Q: 0,
    });

    expect(cCooking).toBeGreaterThan(cClean);
    // Delta should be (2000 / 80) / 0.7 = 25 / 0.7 ≈ 35.71 µg/m³
    expect(cCooking - cClean).toBeCloseTo(35.71, 1);
  });

  it('verifies hourly dynamics converge asymptotically to steady state', () => {
    const constantOutdoor = new Array(24).fill(300);
    const profile = demoSnapshot.profile as HouseholdProfile;

    // Start with indoor PM2.5 elevated at 500 µg/m³
    const { hourlyIndoor, steadyStates } = computeHourlyIndoor(constantOutdoor, profile, {
      initialIndoor: 500,
    });

    const targetSteadyState = steadyStates[0];
    expect(hourlyIndoor[0]).toBe(500);

    // Each subsequent hour must get closer or remain at converged steady state
    for (let t = 1; t < hourlyIndoor.length; t++) {
      const prevDiff = Math.abs(hourlyIndoor[t - 1] - targetSteadyState);
      const currDiff = Math.abs(hourlyIndoor[t] - targetSteadyState);
      if (prevDiff > 1e-4) {
        expect(currDiff).toBeLessThan(prevDiff);
      } else {
        expect(currDiff).toBeLessThanOrEqual(prevDiff);
      }
    }

    // By hour 23, it should be converged within 0.1 µg/m³ of steady state
    expect(hourlyIndoor[23]).toBeCloseTo(targetSteadyState, 1);
  });

  it('calculates effective CADR with different filter ages', () => {
    // Brand new filter (< 6 months): factor 1.0, placement 0.8
    const devNew = {
      type: 'purifier' as const,
      cadrM3h: 300,
      filterAgeMonths: 2,
    };
    expect(getEffectiveCADR(devNew)).toBeCloseTo(300 * 1.0 * 0.8, 1); // 240

    // 6-12 months: factor 0.8
    const dev6mo = {
      type: 'purifier' as const,
      cadrM3h: 300,
      filterAgeMonths: 8,
    };
    expect(getEffectiveCADR(dev6mo)).toBeCloseTo(300 * 0.8 * 0.8, 1); // 192

    // 12-18 months: factor 0.6
    const dev14mo = {
      type: 'purifier' as const,
      cadrM3h: 300,
      filterAgeMonths: 14,
    };
    expect(getEffectiveCADR(dev14mo)).toBeCloseTo(300 * 0.6 * 0.8, 1); // 144

    // > 18 months: factor 0.4
    const dev24mo = {
      type: 'purifier' as const,
      cadrM3h: 300,
      filterAgeMonths: 24,
    };
    expect(getEffectiveCADR(dev24mo)).toBeCloseTo(300 * 0.4 * 0.8, 1); // 96
  });

  it('adding or sizing up a purifier always reduces indoor PM2.5', () => {
    const profileNoPurifier: HouseholdProfile = {
      ...(demoSnapshot.profile as HouseholdProfile),
      devices: [],
    };

    const profileWithPurifier: HouseholdProfile = {
      ...(demoSnapshot.profile as HouseholdProfile),
      devices: [
        {
          type: 'purifier',
          cadrM3h: 350,
          filterAgeMonths: 1,
        },
      ],
    };

    const outdoorData = [320, 350, 380, 300, 250, 200];
    const resNo = computeHourlyIndoor(outdoorData, profileNoPurifier);
    const resWith = computeHourlyIndoor(outdoorData, profileWithPurifier);

    for (let t = 0; t < outdoorData.length; t++) {
      expect(resWith.hourlyIndoor[t]).toBeLessThan(resNo.hourlyIndoor[t]);
    }
  });

  it('correctly calculates indoor sources from profile fuels and habits', () => {
    const cleanProfile: HouseholdProfile = {
      ...(demoSnapshot.profile as HouseholdProfile),
      home: {
        ...(demoSnapshot.profile.home as HouseholdProfile['home']),
        cooking: ['induction'],
        heating: ['electric'],
        smokingIndoors: false,
        incenseOrCoils: 'never',
        exhaustHood: false,
      },
    };
    expect(getIndoorSources(cleanProfile)).toBe(50); // induction cooking

    const biomassProfile: HouseholdProfile = {
      ...cleanProfile,
      home: {
        ...cleanProfile.home,
        cooking: ['biomass'],
        smokingIndoors: true,
      },
    };
    // 10000 (biomass) + 3000 (smoking) = 13000
    expect(getIndoorSources(biomassProfile)).toBe(13000);
  });
});
