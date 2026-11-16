import { describe, it, expect } from 'vitest';
import {
  validateNoStrayNumbers,
  substituteTokens,
  validatePlanNoStrayNumbers,
} from '@/lib/gemini/validator';
import { Plan, Receipt } from '@/lib/schemas';

describe('Gemini Numbers-by-Reference Validator', () => {
  it('allows text containing valid reference tokens without stray digits', () => {
    const text = 'Running your purifier reduces PM2.5 exposure to [[r1.breathe.after]] µg/m³·h.';
    const result = validateNoStrayNumbers(text);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('allows clock times in 12-hour and 24-hour formats', () => {
    const text1 = 'Ventilate between 2:00 PM and 4:00 PM when outdoor air is cleanest.';
    expect(validateNoStrayNumbers(text1).valid).toBe(true);

    const text2 = 'Turn purifier to high mode at 14:00 and sleep mode at 22:30.';
    expect(validateNoStrayNumbers(text2).valid).toBe(true);

    const text3 = 'Optimal window starts at 3 PM and ends at 5 PM.';
    expect(validateNoStrayNumbers(text3).valid).toBe(true);
  });

  it('allows calendar dates in various formats', () => {
    const text1 = 'Advisory effective from 2025-01-15 through 2025-01-20.';
    expect(validateNoStrayNumbers(text1).valid).toBe(true);

    const text2 = 'High smog forecast predicted for Jan 15, 2025.';
    expect(validateNoStrayNumbers(text2).valid).toBe(true);

    const text3 = 'Filter replacement scheduled for 15th January.';
    expect(validateNoStrayNumbers(text3).valid).toBe(true);
  });

  it('rejects free text containing stray numbers', () => {
    const text1 = 'This action will reduce your air pollution by 40% immediately.';
    const result1 = validateNoStrayNumbers(text1);
    expect(result1.valid).toBe(false);
    expect(result1.violations.length).toBeGreaterThan(0);

    const text2 = 'Your indoor AQI reached 350 today, costing 500 rupees.';
    const result2 = validateNoStrayNumbers(text2);
    expect(result2.valid).toBe(false);
  });

  it('substitutes reference tokens correctly from receipts map', () => {
    const mockReceipt: Receipt = {
      id: 'rcpt_purifier_evening',
      actionId: 'purifier_run_high_bedroom_evening',
      memberIds: ['m1'],
      formulaId: 'indoor_purification',
      breathe: {
        metric: 'pm25_exposure_reduction_pct',
        before: 180,
        after: 28,
        deltaPct: 84,
        unit: 'µg/m³·h',
        low: 58,
        high: 95,
      },
      give: {
        co2e_g: 150,
        period: 'daily',
      },
      cost: {
        upfront: 0,
        ongoing: 15,
        currency: 'INR',
      },
      effort: 1,
      evidence: 'A',
      confidence: 'high',
      assumptions: [],
    };

    const receipts = {
      r1: mockReceipt,
    };

    const template =
      'Breathe before: [[r1.breathe.before]], after: [[r1.breathe.after]], reduction: [[r1.breathe.deltaPct]]%. Avoided [[r1.give.co2e_g]]g CO2e.';
    const substituted = substituteTokens(template, receipts);

    expect(substituted).toBe(
      'Breathe before: 180, after: 28, reduction: 84%. Avoided 150g CO2e.'
    );
  });

  it('validates a complete Plan structure and catches stray numbers in fields', () => {
    const badPlan: Plan = {
      generatedAt: '2025-01-15T00:00:00Z',
      language: 'en',
      headline: 'Air pollution alert: PM2.5 reached 450 today!', // Stray 450
      severityTier: 'Severe',
      topActions: [
        {
          receiptId: 'r1',
          why: 'Reduces PM2.5 to [[r1.breathe.after]].',
          how: 'Run on high speed at 8:00 PM.',
          whenWindow: 'Evening',
          forWhom: 'Family',
        },
      ],
      timeline: Array(24)
        .fill(null)
        .map((_, i) => ({
          hour: i,
          aqiBand: 'Severe',
          tags: [],
          advice: 'Stay indoors with clean air.',
        })),
      perMember: [],
      safetyNotes: [],
      citations: [],
    };

    const result = validatePlanNoStrayNumbers(badPlan);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes('headline'))).toBe(true);
  });
});
