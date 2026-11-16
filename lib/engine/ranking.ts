/**
 * Saans Action Ranking & Recommendation Engine
 *
 * Ranking Formula:
 * Score = Σ(vulnerability × exposure_reduction) / (effort + cost_weight)
 *
 * Rules:
 * - Filter actions by appliesWhen / blockedWhen / renter / budget constraints
 * - Critical life-safety actions (CO warning & ventilation for combustion heating)
 *   are prioritized immediately
 * - Diversify recommendations: maximum 2 actions per category
 * - Select top 3 actions for the day + "when you can" backlog
 */

import {
  Action,
  HouseholdProfile,
  HourlyAir,
  Member,
  Receipt,
} from '@/lib/schemas';
import actionsData from '@/data/actions.json';
import constantsData from '@/data/constants.json';
import { computeActionEmissions } from './emissions';
import { computeHourlyIndoor, getTotalEffectiveCADR } from './indoor';
import { computeHouseholdExposure } from './exposure';

export interface RankedAction {
  action: Action;
  receipt: Receipt;
  score: number;
  rank: number;
  why: string;
}

export interface EvaluationContext {
  outdoor_pm25: number;
  indoor_pm25: number;
  aqi: number;
  has_children: boolean;
  has_purifier: boolean;
  purifier_cadr: number;
  filter_age_months: number;
  budget_band: string;
  has_doors: boolean;
  has_exhaust_hood: boolean;
  incense_or_coils: string;
  smoking_indoors: boolean;
  window_leakiness: string;
  cooking: string[];
  heating: string[];
  commute_modes: string[];
  mask_owned: string[];
  has_asthma: boolean;
  has_heart_or_copd: boolean;
  has_car: boolean;
  has_two_wheeler: boolean;
  can_open_windows: boolean;
  renter: boolean;
  removable_weatherstrip: boolean;
}

/**
 * Computes vulnerability multiplier for a household member.
 * Weights: infant/toddler/child 1.5, senior 1.3, asthma/copd/heart 2.0, pregnant 1.5, adult 1.0.
 * Combined by MAX.
 */
export function getMemberVulnerability(member: Member): number {
  let ageWeight = 1.0;
  if (['infant', 'toddler', 'child'].includes(member.ageBand)) {
    ageWeight = constantsData.vulnerability_weights.child.value ?? 1.5;
  } else if (member.ageBand === 'senior') {
    ageWeight = constantsData.vulnerability_weights.senior.value ?? 1.3;
  } else {
    ageWeight = constantsData.vulnerability_weights.adult.value ?? 1.0;
  }

  const weights: number[] = [ageWeight];

  if (member.conditions) {
    for (const cond of member.conditions) {
      if (['asthma', 'copd', 'heart'].includes(cond)) {
        weights.push(2.0);
      } else if (cond === 'pregnant') {
        weights.push(1.5);
      } else if (cond === 'diabetes') {
        weights.push(1.2);
      }
    }
  }

  return Math.max(...weights);
}

/**
 * Computes overall household maximum vulnerability factor.
 */
export function getHouseholdMaxVulnerability(profile: HouseholdProfile): number {
  if (!profile.members || profile.members.length === 0) return 1.0;
  return Math.max(...profile.members.map(getMemberVulnerability));
}

/**
 * Builds an evaluation context from household profile and ambient air data.
 */
export function buildEvaluationContext(
  profile: HouseholdProfile,
  hourlyAir?: HourlyAir[]
): EvaluationContext {
  const avgOutdoor =
    hourlyAir && hourlyAir.length > 0
      ? hourlyAir.reduce((s, h) => s + h.pm25, 0) / hourlyAir.length
      : 300;
  const avgAqi =
    hourlyAir && hourlyAir.length > 0
      ? hourlyAir.reduce((s, h) => s + h.usAqi, 0) / hourlyAir.length
      : 350;

  const outdoorList = hourlyAir ? hourlyAir.map((h) => h.pm25) : [avgOutdoor];
  const { hourlyIndoor } = computeHourlyIndoor(outdoorList, profile);
  const avgIndoor =
    hourlyIndoor.length > 0
      ? hourlyIndoor.reduce((s, v) => s + v, 0) / hourlyIndoor.length
      : 180;

  const devices = profile.devices || [];
  const purifiers = devices.filter(
    (d) => d.type === 'purifier' || d.type === 'diy_filter'
  );
  const hasPurifier = purifiers.length > 0;
  const maxPurifierCadr = purifiers.reduce(
    (max, d) => Math.max(max, d.cadrM3h ?? (d.type === 'diy_filter' ? 350 : 0)),
    0
  );
  const maxFilterAge = purifiers.reduce(
    (max, d) => Math.max(max, d.filterAgeMonths ?? 0),
    0
  );

  const members = profile.members || [];
  const hasChildren = members.some((m) =>
    ['infant', 'toddler', 'child'].includes(m.ageBand)
  );
  const hasAsthma = members.some((m) => m.conditions?.includes('asthma'));
  const hasHeartOrCopd = members.some((m) =>
    m.conditions?.some((c) => ['heart', 'copd'].includes(c))
  );

  const commuteModes = members.map((m) => m.commute?.mode || 'none');
  const masksOwned = members.map((m) => m.maskOwned || 'none');

  const hasCar =
    Boolean(profile.constraints?.hasCar) || commuteModes.includes('car');
  const hasTwoWheeler =
    Boolean(profile.constraints?.hasTwoWheeler) || commuteModes.includes('two_wheeler');

  return {
    outdoor_pm25: avgOutdoor,
    indoor_pm25: avgIndoor,
    aqi: avgAqi,
    has_children: hasChildren,
    has_purifier: hasPurifier,
    purifier_cadr: maxPurifierCadr,
    filter_age_months: maxFilterAge,
    budget_band: profile.constraints?.budgetBand || 'low',
    has_doors: true,
    has_exhaust_hood: Boolean(profile.home?.exhaustHood),
    incense_or_coils: profile.home?.incenseOrCoils || 'never',
    smoking_indoors: Boolean(profile.home?.smokingIndoors),
    window_leakiness: profile.home?.windowLeakiness || 'average',
    cooking: profile.home?.cooking || ['lpg'],
    heating: profile.home?.heating || ['none'],
    commute_modes: commuteModes,
    mask_owned: masksOwned,
    has_asthma: hasAsthma,
    has_heart_or_copd: hasHeartOrCopd,
    has_car: hasCar,
    has_two_wheeler: hasTwoWheeler,
    can_open_windows: profile.home?.canOpenWindows !== false,
    renter: Boolean(profile.home?.renter),
    removable_weatherstrip: false,
  };
}

/**
 * Evaluates an appliesWhen / blockedWhen condition string in the evaluation context.
 */
export function evaluateCondition(expr: string | null | undefined, ctx: EvaluationContext): boolean {
  if (!expr || expr.trim() === '' || expr === 'always') return true;

  const trimmed = expr.trim();

  // Split on top-level OR
  if (trimmed.includes(' OR ')) {
    const parts = trimmed.split(' OR ');
    return parts.some((p) => evaluateCondition(p, ctx));
  }

  // Split on top-level AND
  if (trimmed.includes(' AND ')) {
    const parts = trimmed.split(' AND ');
    return parts.every((p) => evaluateCondition(p, ctx));
  }

  // Handle single clauses
  if (trimmed === 'outdoor_pm25 < indoor_pm25') {
    return ctx.outdoor_pm25 < ctx.indoor_pm25;
  }
  if (trimmed.startsWith('aqi > ')) {
    const val = parseFloat(trimmed.replace('aqi > ', ''));
    return ctx.aqi > val;
  }
  if (trimmed === 'has_children') {
    return ctx.has_children;
  }
  if (trimmed === 'has_purifier') {
    return ctx.has_purifier;
  }
  if (trimmed === 'purifier_cadr > 0') {
    return ctx.purifier_cadr > 0;
  }
  if (trimmed.startsWith('filter_age_months > ')) {
    const val = parseFloat(trimmed.replace('filter_age_months > ', ''));
    return ctx.filter_age_months > val;
  }
  if (trimmed === "budget_band in ['none','low']") {
    return ['none', 'low'].includes(ctx.budget_band);
  }
  if (trimmed === "budget_band != 'none'") {
    return ctx.budget_band !== 'none';
  }
  if (trimmed === 'has_doors') {
    return ctx.has_doors;
  }
  if (trimmed === 'has_exhaust_hood') {
    return ctx.has_exhaust_hood;
  }
  if (trimmed === "incense_or_coils != 'never'") {
    return ctx.incense_or_coils !== 'never';
  }
  if (trimmed === 'smoking_indoors == true') {
    return ctx.smoking_indoors;
  }
  if (trimmed === "window_leakiness != 'tight'") {
    return ctx.window_leakiness !== 'tight';
  }
  if (trimmed.startsWith("cooking includes '")) {
    const fuel = trimmed.slice("cooking includes '".length, -1);
    return ctx.cooking.includes(fuel);
  }
  if (trimmed.startsWith("heating includes '")) {
    const fuel = trimmed.slice("heating includes '".length, -1);
    return ctx.heating.includes(fuel);
  }
  if (trimmed.includes("commute_mode in ['walk','cycle','two_wheeler','auto']")) {
    return ctx.commute_modes.some((m) =>
      ['walk', 'cycle', 'two_wheeler', 'auto'].includes(m)
    );
  }
  if (trimmed.includes("commute_mode in ['walk','cycle']")) {
    return ctx.commute_modes.some((m) => ['walk', 'cycle'].includes(m));
  }
  if (trimmed === "commute_mode == 'car'") {
    return ctx.commute_modes.includes('car');
  }
  if (trimmed === "mask_owned != 'none'") {
    return ctx.mask_owned.some((m) => m !== 'none');
  }
  if (trimmed === 'has_asthma') {
    return ctx.has_asthma;
  }
  if (trimmed === 'has_car') {
    return ctx.has_car;
  }
  if (trimmed === 'has_two_wheeler') {
    return ctx.has_two_wheeler;
  }
  if (trimmed === 'can_open_windows') {
    return ctx.can_open_windows;
  }
  if (trimmed === 'renter') {
    return ctx.renter;
  }
  if (trimmed === 'NOT removable_weatherstrip') {
    return !ctx.removable_weatherstrip;
  }

  // Fallback for renter blocked check
  if (trimmed.includes('renter') && trimmed.includes('NOT removable_weatherstrip')) {
    return ctx.renter && !ctx.removable_weatherstrip;
  }

  return true;
}

/**
 * Filters actions based on household suitability and constraints.
 */
export function filterActions(
  profile: HouseholdProfile,
  actions?: Action[],
  hourlyAir?: HourlyAir[]
): Action[] {
  const allActions: Action[] = (actions || (actionsData as unknown as Action[]));
  const ctx = buildEvaluationContext(profile, hourlyAir);

  const hasCombustionHeater = profile.home?.heating?.some((h) =>
    ['coal_charcoal', 'wood', 'gas'].includes(h)
  );

  return allActions.filter((action) => {
    // Critical safety override:
    // If combustion heater present, never seal room!
    if (
      hasCombustionHeater &&
      (action.id === 'seal_door_and_window_gaps' ||
        action.id === 'keep_doors_closed_in_purified_room')
    ) {
      return false;
    }

    // Renters cannot make permanent structural window/wall alterations
    if (ctx.renter && action.id === 'seal_door_and_window_gaps') {
      if (action.blockedWhen && evaluateCondition(action.blockedWhen, ctx)) {
        return false;
      }
    }

    // Check appliesWhen
    if (!evaluateCondition(action.appliesWhen, ctx)) {
      // Exception: if combustion heater present, CO safety actions MUST apply
      if (
        hasCombustionHeater &&
        (action.id === 'never_seal_room_with_combustion_heater' ||
          action.id === 'install_co_alarm')
      ) {
        return true;
      }
      return false;
    }

    // Check blockedWhen
    if (action.blockedWhen && evaluateCondition(action.blockedWhen, ctx)) {
      return false;
    }

    return true;
  });
}

/**
 * Creates or retrieves a synthetic Receipt for a given action and household profile.
 */
export function createReceiptForAction(
  action: Action,
  profile: HouseholdProfile,
  hourlyAir?: HourlyAir[]
): Receipt {
  const outdoorList =
    hourlyAir && hourlyAir.length > 0
      ? hourlyAir.map((h) => h.pm25)
      : [320, 350, 300, 250, 200, 220, 280, 340];

  const baselineIndoor = computeHourlyIndoor(outdoorList, profile);
  const baselineExposure = computeHouseholdExposure(
    profile,
    baselineIndoor.hourlyIndoor,
    outdoorList
  );
  const baseAvg =
    baselineExposure.reduce((s, m) => s + m.totalExposure, 0) /
    Math.max(1, baselineExposure.length);

  // Estimate reduction based on action category and formula
  let reductionFraction = 0.15;
  if (action.evidence === 'A') reductionFraction = 0.35;
  else if (action.evidence === 'B') reductionFraction = 0.22;
  else if (action.evidence === 'C') reductionFraction = 0.10;
  else if (action.evidence === 'D') reductionFraction = 0.01;

  if (action.id === 'replace_overdue_filter') reductionFraction = 0.40;
  if (action.id === 'n95_or_ffp2_for_outdoor_commute') reductionFraction = 0.35;
  if (action.id === 'never_seal_room_with_combustion_heater') reductionFraction = 0.50;

  const afterAvg = Math.max(10, baseAvg * (1 - reductionFraction));
  const deltaPct = Math.round(reductionFraction * 100);

  const giveEmissions = computeActionEmissions(action.id, profile);

  let upfrontCost = 0;
  if (action.costBand === 'low') upfrontCost = 250;
  if (action.costBand === 'medium') upfrontCost = 2500;
  if (action.costBand === 'high') upfrontCost = 8000;

  return {
    id: `rcpt_${action.id}`,
    actionId: action.id,
    memberIds: profile.members.map((m) => m.id),
    formulaId: action.formulaId,
    breathe: {
      metric: 'pm25_exposure_reduction_pct',
      before: Math.round(baseAvg),
      after: Math.round(afterAvg),
      deltaPct,
      unit: 'µg/m³·h',
      low: Math.max(0, Math.round(deltaPct * 0.7)),
      high: Math.min(95, Math.round(deltaPct * 1.3)),
    },
    give: giveEmissions,
    cost: {
      upfront: upfrontCost,
      ongoing: 0,
      currency: 'INR',
    },
    effort: action.effort,
    evidence: action.evidence,
    confidence: action.evidence === 'A' ? 'high' : action.evidence === 'B' ? 'medium' : 'low',
    assumptions: [
      {
        label: 'Baseline 24h exposure',
        value: Math.round(baseAvg),
        unit: 'µg·h/m³',
        source: 'Saans indoor mass balance model',
      },
      {
        label: 'Expected exposure reduction',
        value: deltaPct,
        unit: '%',
        source: action.evidenceWhy,
      },
    ],
  };
}

/**
 * Computes cost weight for the score denominator.
 */
function getCostWeight(costBand: 'none' | 'low' | 'medium' | 'high' | string, budgetBand: string): number {
  let baseWeight = 0.5;
  switch (costBand) {
    case 'none':
      baseWeight = 0.5;
      break;
    case 'low':
      baseWeight = 1.0;
      break;
    case 'medium':
      baseWeight = 2.0;
      break;
    case 'high':
      baseWeight = 3.5;
      break;
  }

  // High cost penalty if user has low/none budget
  if (budgetBand === 'none' && costBand !== 'none') {
    baseWeight *= 2.5;
  } else if (budgetBand === 'low' && costBand === 'high') {
    baseWeight *= 2.0;
  }

  return baseWeight;
}

/**
 * Ranks actions for the household profile using the formula:
 * Score = Σ(vulnerability × exposure_reduction) / (effort + cost_weight)
 *
 * Applies category diversification (max 2 per category), and sorts by score.
 */
export function rankActions(
  profile: HouseholdProfile,
  hourlyAir?: HourlyAir[],
  receipts?: Receipt[]
): RankedAction[] {
  const eligibleActions = filterActions(profile, undefined, hourlyAir);
  const vulnerability = getHouseholdMaxVulnerability(profile);
  const budgetBand = profile.constraints?.budgetBand || 'low';

  const receiptMap = new Map<string, Receipt>();
  if (receipts && receipts.length > 0) {
    for (const r of receipts) {
      receiptMap.set(r.actionId, r);
    }
  }

  const scoredActions: { action: Action; receipt: Receipt; score: number; why: string }[] = [];

  const hasCombustionHeater = profile.home?.heating?.some((h) =>
    ['coal_charcoal', 'wood', 'gas'].includes(h)
  );

  for (const action of eligibleActions) {
    const receipt = receiptMap.get(action.id) || createReceiptForAction(action, profile, hourlyAir);
    const costWeight = getCostWeight(action.costBand, budgetBand);

    // Exposure reduction magnitude
    const exposureReduction = Math.max(1, receipt.breathe.deltaPct);

    // Give Ledger bonus if action avoids community emissions
    const giveBonus = (receipt.give.pm25_g ?? 0) > 0 ? 10 : 0;

    // Base score calculation
    let rawScore =
      (vulnerability * exposureReduction + giveBonus) / (action.effort + costWeight);

    // Life-safety actions get absolute top priority
    if (
      hasCombustionHeater &&
      (action.id === 'never_seal_room_with_combustion_heater' ||
        action.id === 'install_co_alarm')
    ) {
      rawScore += 5000;
    }

    // Critical urgent actions
    if (action.id === 'replace_overdue_filter') {
      rawScore += 100;
    }

    // Myth checks (evidence grade D) get relegated to educational reference
    if (action.evidence === 'D') {
      rawScore = 0.1;
    }

    let why = action.whoBenefits;
    if (hasCombustionHeater && action.id === 'never_seal_room_with_combustion_heater') {
      why = 'CRITICAL LIFE-SAFETY: Prevents fatal carbon monoxide poisoning while fuel heating operates.';
    }

    scoredActions.push({
      action,
      receipt,
      score: Math.round(rawScore * 10) / 10,
      why,
    });
  }

  // Sort strictly by score descending
  scoredActions.sort((a, b) => b.score - a.score);

  // Apply diversification: max 2 actions per category
  const categoryCounts: Record<string, number> = {};
  const diversified: typeof scoredActions = [];
  const deferred: typeof scoredActions = [];

  for (const item of scoredActions) {
    const cat = item.action.category;
    const count = categoryCounts[cat] || 0;
    if (count < 2) {
      diversified.push(item);
      categoryCounts[cat] = count + 1;
    } else {
      deferred.push(item);
    }
  }

  const finalList = [...diversified, ...deferred];

  return finalList.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * Splits ranked actions into Top 3 for the day and the remaining 'When you can' list.
 */
export function getTopAndWhenYouCan(rankedActions: RankedAction[]): {
  top3: RankedAction[];
  whenYouCan: RankedAction[];
} {
  return {
    top3: rankedActions.slice(0, 3),
    whenYouCan: rankedActions.slice(3),
  };
}
