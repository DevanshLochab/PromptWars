import { Plan, Receipt } from '@/lib/schemas';

export interface ValidationResult {
  valid: boolean;
  violations: string[];
}

/**
 * Validates that free text contains NO stray numbers.
 * Allowed exceptions:
 * 1. Reference tokens like [[r1.breathe.after]] or [[rcpt_1.give.co2e_g]]
 * 2. Clock times (e.g., 2:00 PM, 14:00, 2 PM, 9:30 AM)
 * 3. Calendar dates (e.g., 2025-01-15, 15/01/2025, Jan 15, January 15th, 15 Jan 2025)
 */
export function validateNoStrayNumbers(text: string): ValidationResult {
  if (!text || text.trim() === '') {
    return { valid: true, violations: [] };
  }

  // Step 1: Strip out reference tokens: [[...]]
  let sanitized = text.replace(/\[\[[\w.-]+\]\]/g, ' [REF_TOKEN] ');

  // Step 1b: Strip out standard environmental science acronyms, pollutants, mask standards, and units
  // Pollutants: PM2.5, PM10, PM1, NO2, SO2, CO2, CO2e, O3
  sanitized = sanitized.replace(/\bPM(?:2\.5|10|1)\b/gi, ' [POLLUTANT] ');
  sanitized = sanitized.replace(/\b(?:NO2|SO2|CO2e?|O3)\b/gi, ' [POLLUTANT] ');
  // Mask and filter standards: N95, KN95, FFP2, FFP3, KF94, MERV-13
  sanitized = sanitized.replace(/\b(?:N|KN|KF)9[45]\b/gi, ' [MASK_STD] ');
  sanitized = sanitized.replace(/\bFFP[123]\b/gi, ' [MASK_STD] ');
  sanitized = sanitized.replace(/\bMERV-?\d+\b/gi, ' [FILTER_STD] ');
  // Scientific units with exponents or indices (e.g. m³, m3, µg/m³, µg/m³·h)
  sanitized = sanitized.replace(/µ?g\/m[3³](?:·h)?/gi, ' [UNIT] ');
  sanitized = sanitized.replace(/m[3³]\/h/gi, ' [UNIT] ');
  sanitized = sanitized.replace(/m[23²³]/gi, ' [UNIT] ');

  // Step 2: Strip out standard calendar dates
  // ISO date: YYYY-MM-DD
  sanitized = sanitized.replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' [DATE_ISO] ');
  // Slash or dash dates: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY
  sanitized = sanitized.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, ' [DATE_SLASH] ');
  // Month Day (e.g., Jan 15, January 15th, Jan 15, 2025)
  sanitized = sanitized.replace(
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b/gi,
    ' [DATE_MONTH_DAY] '
  );
  // Day Month (e.g., 15th January, 15 Jan 2025)
  sanitized = sanitized.replace(
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:,?\s+\d{4})?\b/gi,
    ' [DATE_DAY_MONTH] '
  );
  // Standalone ordinal days (e.g. "on the 15th")
  sanitized = sanitized.replace(/\b\d{1,2}(?:st|nd|rd|th)\b/gi, ' [ORDINAL] ');

  // Step 3: Strip out clock times
  // 12-hour or 24-hour: 2:00 PM, 14:00, 09:30 AM, 2:30pm
  sanitized = sanitized.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/g, ' [TIME] ');
  // Hour with AM/PM: 2 PM, 10 am, 11PM
  sanitized = sanitized.replace(/\b\d{1,2}\s*(?:AM|PM|am|pm)\b/g, ' [TIME_AMPM] ');

  // Step 4: Check for any remaining digit sequences
  const strayDigitMatches = sanitized.match(/\S*\d+\S*/g);

  if (strayDigitMatches && strayDigitMatches.length > 0) {
    return {
      valid: false,
      violations: strayDigitMatches.map((m) => `Stray number found in text: "${m}"`),
    };
  }

  return { valid: true, violations: [] };
}

/**
 * Validates that an entire generated Plan adheres to the no-stray-numbers rule.
 */
export function validatePlanNoStrayNumbers(plan: Plan): ValidationResult {
  const violations: string[] = [];

  const check = (label: string, text: string) => {
    const res = validateNoStrayNumbers(text);
    if (!res.valid) {
      violations.push(...res.violations.map((v) => `[${label}] ${v}`));
    }
  };

  check('headline', plan.headline);

  plan.topActions.forEach((ta, idx) => {
    check(`topActions[${idx}].why`, ta.why);
    check(`topActions[${idx}].how`, ta.how);
    check(`topActions[${idx}].forWhom`, ta.forWhom);
  });

  plan.timeline.forEach((tl, idx) => {
    check(`timeline[${idx}].advice`, tl.advice);
  });

  plan.perMember.forEach((pm, idx) => {
    pm.tips.forEach((tip, tipIdx) => {
      check(`perMember[${idx}].tips[${tipIdx}]`, tip);
    });
  });

  plan.safetyNotes.forEach((sn, idx) => {
    check(`safetyNotes[${idx}]`, sn);
  });

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Resolves a dotted path (e.g. "breathe.after", "give.co2e_g") against an object.
 */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Substitutes reference tokens like [[r1.breathe.after]] or [[rcpt_xyz.give.co2e_g]]
 * with real values from receipts.
 */
export function substituteTokens(
  text: string,
  receipts: Record<string, Receipt> | Receipt[]
): string {
  if (!text) return '';

  // Build a lookup map of receipts
  const receiptMap = new Map<string, Receipt>();

  if (Array.isArray(receipts)) {
    receipts.forEach((r, idx) => {
      receiptMap.set(`r${idx + 1}`, r);
      receiptMap.set(r.id, r);
      receiptMap.set(r.actionId, r);
    });
  } else {
    Object.entries(receipts).forEach(([k, r], idx) => {
      receiptMap.set(k, r);
      receiptMap.set(`r${idx + 1}`, r);
      receiptMap.set(r.id, r);
      receiptMap.set(r.actionId, r);
    });
  }

  // Replace [[key.path]]
  return text.replace(/\[\[([\w.-]+)\]\]/g, (match, expression: string) => {
    const firstDot = expression.indexOf('.');
    if (firstDot === -1) {
      return match;
    }

    const key = expression.substring(0, firstDot);
    const path = expression.substring(firstDot + 1);

    const receipt = receiptMap.get(key);
    if (!receipt) {
      // Key not found in receipts
      return match;
    }

    const val = resolvePath(receipt as unknown as Record<string, unknown>, path);
    if (val === undefined || val === null) {
      return match;
    }

    if (typeof val === 'number') {
      // Format number nicely
      if (Number.isInteger(val)) {
        return val.toString();
      }
      return val.toFixed(1);
    }

    return String(val);
  });
}

/**
 * Recursively substitutes reference tokens throughout a Plan object.
 */
export function substitutePlanTokens(
  plan: Plan,
  receipts: Record<string, Receipt> | Receipt[]
): Plan {
  const sub = (t: string) => substituteTokens(t, receipts);

  return {
    ...plan,
    headline: sub(plan.headline),
    topActions: plan.topActions.map((ta) => ({
      ...ta,
      why: sub(ta.why),
      how: sub(ta.how),
      whenWindow: sub(ta.whenWindow),
      forWhom: sub(ta.forWhom),
    })),
    timeline: plan.timeline.map((tl) => ({
      ...tl,
      advice: sub(tl.advice),
    })),
    perMember: plan.perMember.map((pm) => ({
      ...pm,
      tips: pm.tips.map(sub),
    })),
    safetyNotes: plan.safetyNotes.map(sub),
  };
}
