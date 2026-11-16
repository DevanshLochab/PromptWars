/**
 * Saans Indoor Air Quality Model
 * Single-compartment mass balance model for indoor PM2.5.
 *
 * Steady-state:
 * C_in = (P * a * C_out + S/V) / (a + k + Q/V)
 *
 * Hourly dynamics:
 * λ = a + k + Q/V
 * C(t+1) = C_ss + (C(t) - C_ss) * exp(-λ)
 */

import { Device, HouseholdProfile } from '@/lib/schemas';
import constantsData from '@/data/constants.json';
import indoorSourcesData from '@/data/indoor_sources.json';

export interface SteadyStateParams {
  cOut: number;
  P: number;
  a: number;
  k: number;
  S: number;
  V: number;
  Q: number;
}

export interface HourlyIndoorOptions {
  windowState?: 'closed' | 'cracked' | 'open';
  overrideCADR?: number;
  overrideS?: number;
  initialIndoor?: number;
}

/**
 * Computes the steady-state indoor PM2.5 concentration in µg/m³.
 */
export function computeSteadyState(params: SteadyStateParams): number {
  const { cOut, P, a, k, S, V, Q } = params;
  const safeV = Math.max(0.1, V);
  const numerator = P * a * cOut + S / safeV;
  const denominator = a + k + Q / safeV;

  if (denominator <= 0) return 0;
  return Math.max(0, numerator / denominator);
}

/**
 * Calculates effective Clean Air Delivery Rate (CADR in m³/h) for a device.
 * CADR_eff = label_CADR × filterHealthFactor × placementFactor(0.8)
 */
export function getEffectiveCADR(device: Device): number {
  if (device.type !== 'purifier' && device.type !== 'diy_filter') {
    return 0;
  }

  // Box fan DIY purifiers without explicit CADR default to ~350 m³/h (~205 CFM)
  const labelCADR = device.cadrM3h ?? (device.type === 'diy_filter' ? 350 : 0);
  if (labelCADR <= 0) return 0;

  // Filter health degradation by age
  const ageMonths = device.filterAgeMonths ?? 0;
  let filterHealthFactor = 1.0;
  if (ageMonths < 6) {
    filterHealthFactor = constantsData.filter_health.lt6mo.value;
  } else if (ageMonths < 12) {
    filterHealthFactor = constantsData.filter_health['6to12'].value;
  } else if (ageMonths < 18) {
    filterHealthFactor = constantsData.filter_health['12to18'].value;
  } else {
    filterHealthFactor = constantsData.filter_health.gt18.value;
  }

  const placementFactor = constantsData.placement_factor.value ?? 0.8;
  return labelCADR * filterHealthFactor * placementFactor;
}

/**
 * Sums effective CADR across all active purifiers and filters in the household.
 */
export function getTotalEffectiveCADR(devices: Device[]): number {
  if (!devices || devices.length === 0) return 0;
  return devices.reduce((sum, dev) => sum + getEffectiveCADR(dev), 0);
}

/**
 * Returns penetration factor P based on window leakiness.
 */
export function getPenetrationFactor(leakiness: 'tight' | 'average' | 'leaky'): number {
  const entry = constantsData.penetration_factors[leakiness];
  return entry?.value ?? 0.8;
}

/**
 * Returns baseline closed-window air changes per hour (ACH).
 */
export function getBaseAirChangesPerHour(leakiness: 'tight' | 'average' | 'leaky'): number {
  const entry = constantsData.air_change_rates_closed[leakiness];
  return entry?.value ?? 0.5;
}

/**
 * Estimates total indoor PM2.5 source emission rate S (in µg/h).
 */
export function getIndoorSources(profile: HouseholdProfile): number {
  let totalS = 0;
  const home = profile.home;

  // Cooking source
  let cookingS = 0;
  if (home.cooking?.includes('biomass')) {
    cookingS += indoorSourcesData.biomass_cooking.pm25_ug_per_h.value;
  } else if (home.cooking?.includes('lpg')) {
    cookingS += indoorSourcesData.lpg_cooking.pm25_ug_per_h.value;
  } else if (home.cooking?.includes('induction') || home.cooking?.includes('electric')) {
    cookingS += indoorSourcesData.induction_cooking.pm25_ug_per_h.value;
  }

  // Exhaust hood efficiency: captures ~60% of cooking emissions
  if (home.exhaustHood && cookingS > 0) {
    cookingS *= 0.4;
  }
  totalS += cookingS;

  // Indoor smoking
  if (home.smokingIndoors) {
    totalS += indoorSourcesData.cigarette.pm25_ug_per_h.value;
  }

  // Incense or mosquito coils
  if (home.incenseOrCoils === 'daily') {
    totalS += indoorSourcesData.incense_stick.pm25_ug_per_h.value;
  } else if (home.incenseOrCoils === 'sometimes') {
    totalS += indoorSourcesData.incense_stick.pm25_ug_per_h.value * 0.4;
  }

  // Combustion heating (angithi / unvented charcoal / wood)
  if (home.heating?.includes('coal_charcoal')) {
    totalS += 6000;
  } else if (home.heating?.includes('wood')) {
    totalS += 5000;
  }

  return totalS;
}

/**
 * Computes hourly indoor PM2.5 concentrations and steady states over a sequence of outdoor PM2.5 hours.
 */
export function computeHourlyIndoor(
  hourlyOutdoor: number[],
  profile: HouseholdProfile,
  options?: HourlyIndoorOptions
): { hourlyIndoor: number[]; steadyStates: number[] } {
  if (!hourlyOutdoor || hourlyOutdoor.length === 0) {
    return { hourlyIndoor: [], steadyStates: [] };
  }

  const roomArea = profile.home.mainRoomAreaM2 || 30;
  const ceilingHeight = profile.home.ceilingHeightM || 2.7;
  const V = roomArea * ceilingHeight;

  const P = getPenetrationFactor(profile.home.windowLeakiness);
  let a = getBaseAirChangesPerHour(profile.home.windowLeakiness);

  if (options?.windowState === 'cracked') {
    a *= constantsData.air_change_multipliers.cracked.value ?? 3.0;
  } else if (options?.windowState === 'open') {
    a *= constantsData.air_change_multipliers.open.value ?? 6.0;
  }

  const k = constantsData.deposition_rate.value ?? 0.2;
  const Q = options?.overrideCADR !== undefined ? options.overrideCADR : getTotalEffectiveCADR(profile.devices);
  const S = options?.overrideS !== undefined ? options.overrideS : getIndoorSources(profile);

  const lambda = a + k + Q / V;

  // Calculate steady states for each hour
  const steadyStates = hourlyOutdoor.map((cOut) =>
    computeSteadyState({ cOut, P, a, k, S, V, Q })
  );

  const hourlyIndoor: number[] = new Array(hourlyOutdoor.length);

  // Hour 0 initialization
  if (options?.initialIndoor !== undefined) {
    hourlyIndoor[0] = options.initialIndoor;
  } else {
    hourlyIndoor[0] = steadyStates[0];
  }

  // Dynamics: C(t+1) = C_ss(t) + (C(t) - C_ss(t)) * exp(-λ)
  for (let t = 0; t < hourlyOutdoor.length - 1; t++) {
    const cSs = steadyStates[t];
    hourlyIndoor[t + 1] = cSs + (hourlyIndoor[t] - cSs) * Math.exp(-lambda);
  }

  return { hourlyIndoor, steadyStates };
}
