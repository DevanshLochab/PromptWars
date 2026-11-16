import { describe, it, expect } from 'vitest';
import {
  computeMemberExposure,
  computeHouseholdExposure,
  getCommuteRatio,
} from '@/lib/engine/exposure';
import { Member, HouseholdProfile } from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';

describe('Exposure Calculator', () => {
  const sampleMember: Member = {
    id: 'm1',
    nickname: 'Rajesh',
    ageBand: 'adult',
    conditions: ['none'],
    commute: {
      mode: 'two_wheeler',
      km: 12,
      startHour: 9,
      endHour: 18,
    },
    outdoorHoursPerDay: 2.0,
    outdoorActivity: 'light',
    maskOwned: 'none',
  };

  const hourlyIndoor = new Array(24).fill(100);
  const hourlyOutdoor = new Array(24).fill(300);

  it('calculates member total exposure and breakdown by microenvironment', () => {
    const exposure = computeMemberExposure(sampleMember, hourlyIndoor, hourlyOutdoor);

    expect(exposure.totalExposure).toBeGreaterThan(0);
    expect(exposure.byEnvironment.indoor).toBeGreaterThan(0);
    expect(exposure.byEnvironment.outdoor).toBeGreaterThan(0);
    expect(exposure.byEnvironment.commute).toBeGreaterThan(0);

    const sumEnvs =
      exposure.byEnvironment.indoor +
      exposure.byEnvironment.outdoor +
      exposure.byEnvironment.commute;
    expect(exposure.totalExposure).toBeCloseTo(sumEnvs, 2);
  });

  it('wearing a mask reduces outdoor and commute exposure', () => {
    const noMask = computeMemberExposure(sampleMember, hourlyIndoor, hourlyOutdoor, {
      overrideMask: 'none',
    });
    const surgical = computeMemberExposure(sampleMember, hourlyIndoor, hourlyOutdoor, {
      overrideMask: 'surgical',
    });
    const n95 = computeMemberExposure(sampleMember, hourlyIndoor, hourlyOutdoor, {
      overrideMask: 'n95',
    });

    // Surgical gives 30% reduction on outdoor/commute
    expect(surgical.byEnvironment.outdoor).toBeLessThan(noMask.byEnvironment.outdoor);
    expect(surgical.byEnvironment.commute).toBeLessThan(noMask.byEnvironment.commute);

    // N95 gives 70% reduction, significantly superior to surgical
    expect(n95.byEnvironment.outdoor).toBeLessThan(surgical.byEnvironment.outdoor);
    expect(n95.byEnvironment.commute).toBeLessThan(surgical.byEnvironment.commute);
    expect(n95.totalExposure).toBeLessThan(surgical.totalExposure);
  });

  it('verifies commute mode exposure ratios: two_wheeler > auto > bus > car_recirc > metro', () => {
    const ratioTwoWheeler = getCommuteRatio('two_wheeler');
    const ratioAuto = getCommuteRatio('auto');
    const ratioBus = getCommuteRatio('bus');
    const ratioCar = getCommuteRatio('car');
    const ratioMetro = getCommuteRatio('metro');

    expect(ratioTwoWheeler).toBeGreaterThan(ratioAuto);
    expect(ratioAuto).toBeGreaterThan(ratioBus);
    expect(ratioBus).toBeGreaterThan(ratioCar);
    expect(ratioCar).toBeGreaterThan(ratioMetro);

    expect(ratioTwoWheeler).toBe(1.3);
    expect(ratioCar).toBe(0.8);
    expect(ratioMetro).toBe(0.7);
  });

  it('calculates WHO 2021 24h guideline ratio correctly (base: 15 µg/m³ = 360 µg·h/m³)', () => {
    // If someone is exposed to constant 15 µg/m³ for 24 hours, total is 360
    const memberClean: Member = {
      ...sampleMember,
      commute: { mode: 'none', km: 0, startHour: 0, endHour: 0 },
      outdoorHoursPerDay: 0,
      maskOwned: 'none',
    };

    const cleanIndoor = new Array(24).fill(15);
    const cleanOutdoor = new Array(24).fill(15);

    const cleanRes = computeMemberExposure(memberClean, cleanIndoor, cleanOutdoor);
    expect(cleanRes.totalExposure).toBeCloseTo(360, 1);
    expect(cleanRes.whoGuidelineRatio).toBeCloseTo(1.0, 2);

    // Smog conditions: exposed to 150 µg/m³ average → 10× WHO guideline
    const smogIndoor = new Array(24).fill(150);
    const smogOutdoor = new Array(24).fill(150);
    const smogRes = computeMemberExposure(memberClean, smogIndoor, smogOutdoor);
    expect(smogRes.whoGuidelineRatio).toBeCloseTo(10.0, 1);
  });

  it('computes household exposure for all members in demo profile', () => {
    const profile = demoSnapshot.profile as HouseholdProfile;
    const householdExposure = computeHouseholdExposure(profile, hourlyIndoor, hourlyOutdoor);

    expect(householdExposure).toHaveLength(profile.members.length);
    for (const exp of householdExposure) {
      expect(exp.memberId).toBeDefined();
      expect(exp.nickname).toBeDefined();
      expect(exp.totalExposure).toBeGreaterThan(0);
      expect(exp.whoGuidelineRatio).toBeGreaterThan(1);
    }
  });
});
