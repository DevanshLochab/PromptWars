/**
 * Saans Exposure Calculator
 *
 * Microenvironmental model:
 * Exposure index (µg·h/m³) = Σ(C_microenvironment × hours × activityFactor)
 *
 * Microenvironments:
 * - Indoor: indoor PM2.5 model
 * - Outdoor: ambient PM2.5 × outdoor activity factor × (1 - mask_reduction)
 * - Commute: ambient PM2.5 × commute mode ratio × (1 - mask_reduction)
 *
 * WHO 2021 24-hour guideline: 15 µg/m³ (360 µg·h/m³ over 24h)
 */

import { Member, HouseholdProfile } from '@/lib/schemas';
import constantsData from '@/data/constants.json';

export interface MemberExposureResult {
  totalExposure: number;
  byEnvironment: {
    indoor: number;
    outdoor: number;
    commute: number;
  };
  whoGuidelineRatio: number;
}

export interface MemberExposure extends MemberExposureResult {
  memberId: string;
  nickname: string;
  hoursBreakdown: {
    indoor: number;
    outdoor: number;
    commute: number;
  };
}

export interface ExposureOptions {
  overrideMask?: 'none' | 'cloth' | 'surgical' | 'n95';
}

/**
 * Returns the commute exposure ratio based on transport mode.
 */
export function getCommuteRatio(mode: string): number {
  switch (mode) {
    case 'metro':
      return constantsData.commute_exposure_ratios.metro.value ?? 0.7;
    case 'car':
      return constantsData.commute_exposure_ratios.car_recirc.value ?? 0.8;
    case 'bus':
      return constantsData.commute_exposure_ratios.bus.value ?? 1.0;
    case 'auto':
      return constantsData.commute_exposure_ratios.auto.value ?? 1.1;
    case 'two_wheeler':
      return constantsData.commute_exposure_ratios.two_wheeler.value ?? 1.3;
    case 'cycle':
      return constantsData.commute_exposure_ratios.cycle.value ?? 1.1;
    case 'walk':
      return constantsData.commute_exposure_ratios.walk.value ?? 1.0;
    default:
      return 1.0;
  }
}

/**
 * Returns mask filtration reduction factor (0.0 to 1.0).
 */
export function getMaskReduction(mask: string): number {
  switch (mask) {
    case 'n95':
      return constantsData.mask_effectiveness.n95.value ?? 0.7;
    case 'surgical':
      return constantsData.mask_effectiveness.surgical.value ?? 0.3;
    case 'cloth':
      return constantsData.mask_effectiveness.cloth.value ?? 0.2;
    default:
      return 0.0;
  }
}

/**
 * Returns activity factor multiplier for inhalation rate.
 */
export function getActivityFactor(activity: string): number {
  switch (activity) {
    case 'exercise':
      return 1.5;
    case 'physical_work':
      return 2.0;
    case 'light':
    case 'none':
    default:
      return 1.0;
  }
}

/**
 * Computes 24-hour PM2.5 exposure for a single household member.
 */
export function computeMemberExposure(
  member: Member,
  hourlyIndoor: number[],
  hourlyOutdoor: number[],
  options?: ExposureOptions
): MemberExposureResult {
  const avgIndoor =
    hourlyIndoor.length > 0
      ? hourlyIndoor.reduce((a, b) => a + b, 0) / hourlyIndoor.length
      : 0;
  const avgOutdoor =
    hourlyOutdoor.length > 0
      ? hourlyOutdoor.reduce((a, b) => a + b, 0) / hourlyOutdoor.length
      : 0;

  // Mask reduction factor
  const maskType = options?.overrideMask ?? member.maskOwned ?? 'none';
  const maskReduction = getMaskReduction(maskType);
  const maskFactor = Math.max(0, 1.0 - maskReduction);

  // Commute hours & ambient concentration
  let commuteHours = 0;
  let commuteAmbient = avgOutdoor;

  if (member.commute && member.commute.mode !== 'none') {
    if (member.commute.km > 0) {
      // 2 trips per day, estimate transit speed ~25 km/h
      const singleTripH = Math.max(0.2, member.commute.km / 25);
      commuteHours = Math.min(4.0, singleTripH * 2);
    } else {
      commuteHours = 1.0;
    }

    if (hourlyOutdoor.length >= 24) {
      const startC = hourlyOutdoor[member.commute.startHour % 24] ?? avgOutdoor;
      const endC = hourlyOutdoor[member.commute.endHour % 24] ?? avgOutdoor;
      commuteAmbient = (startC + endC) / 2;
    }
  }

  const commuteRatio = getCommuteRatio(member.commute?.mode ?? 'none');
  const commuteExposure = commuteAmbient * commuteRatio * commuteHours * maskFactor;

  // Outdoor activity
  const outdoorHours = Math.max(
    0,
    Math.min(24 - commuteHours, member.outdoorHoursPerDay ?? 1)
  );
  const activityFactor = getActivityFactor(member.outdoorActivity ?? 'none');
  const outdoorExposure = avgOutdoor * outdoorHours * activityFactor * maskFactor;

  // Indoor hours
  const indoorHours = Math.max(0, 24 - commuteHours - outdoorHours);
  const indoorExposure = avgIndoor * indoorHours; // mask not worn indoors at home

  const totalExposure = indoorExposure + outdoorExposure + commuteExposure;

  // WHO 2021 24h guideline: 15 µg/m³ → 360 µg·h/m³ over 24 hours
  const whoGuidelineRatio = totalExposure / 360;

  return {
    totalExposure,
    byEnvironment: {
      indoor: indoorExposure,
      outdoor: outdoorExposure,
      commute: commuteExposure,
    },
    whoGuidelineRatio,
  };
}

/**
 * Computes 24-hour PM2.5 exposure for every member of the household.
 */
export function computeHouseholdExposure(
  profile: HouseholdProfile,
  hourlyIndoor: number[],
  hourlyOutdoor: number[],
  options?: ExposureOptions
): MemberExposure[] {
  return profile.members.map((member) => {
    const res = computeMemberExposure(member, hourlyIndoor, hourlyOutdoor, options);

    let commuteHours = 0;
    if (member.commute && member.commute.mode !== 'none') {
      const singleTripH = member.commute.km > 0 ? Math.max(0.2, member.commute.km / 25) : 0.5;
      commuteHours = Math.min(4.0, singleTripH * 2);
    }
    const outdoorHours = Math.max(0, Math.min(24 - commuteHours, member.outdoorHoursPerDay ?? 1));
    const indoorHours = Math.max(0, 24 - commuteHours - outdoorHours);

    return {
      memberId: member.id,
      nickname: member.nickname,
      ...res,
      hoursBreakdown: {
        indoor: indoorHours,
        outdoor: outdoorHours,
        commute: commuteHours,
      },
    };
  });
}
