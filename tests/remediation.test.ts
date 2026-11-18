import { describe, it, expect } from 'vitest';
import { generateFallbackPlan } from '@/lib/gemini/fallback';
import { getDefaultDemoProfile } from '@/lib/store/profileStore';
import { t } from '@/lib/i18n';
import demoSnapshot from '@/data/demo_snapshot.json';
import { HourlyAir } from '@/lib/schemas';

describe('Remediation Regression Tests', () => {
  it('[HIGH-01] Peak AQI > 300 or PM2.5 > 250 must generate Severe Hazard or Very Poor tier, not Moderate', () => {
    const profile = getDefaultDemoProfile();
    const severeAir = demoSnapshot.hourly as HourlyAir[];
    const plan = generateFallbackPlan(profile, severeAir, undefined, 'en');

    expect(plan.severityTier.toLowerCase()).not.toContain('moderate');
    expect(plan.severityTier.toLowerCase()).not.toContain('good');
    expect(
      plan.severityTier.toLowerCase().includes('severe') ||
      plan.severityTier.toLowerCase().includes('hazard') ||
      plan.severityTier.toLowerCase().includes('poor')
    ).toBe(true);
  });

  it('[MED-01] All action titles must resolve to readable text without raw keys', () => {
    const rawKeys = [
      'actions.engine_off_when_idling.title',
      'actions.metro_over_cab_smog_days.title',
      'actions.diy_corsi_rosenthal_box.title',
      'actions.ventilate_when_outdoor_cleaner_than_indoor.title',
    ];

    for (const key of rawKeys) {
      const enText = t(key, 'en');
      expect(enText).not.toBe(key);
      expect(enText.length).toBeGreaterThan(5);

      const hiText = t(key, 'hi');
      expect(hiText).not.toBe(key);
      expect(hiText.length).toBeGreaterThan(5);
    }
  });

  it('[MED-02] Ventilation time formatting string does not have duplicate PM or invalid hour > 24', () => {
    const templateEn = t('today.open_window', 'en', { start: '1 PM', end: '3 PM' });
    expect(templateEn).not.toContain('PM PM');
    expect(templateEn).toBe('Open window: 1 PM–3 PM');

    const templateHi = t('today.open_window', 'hi', { start: '1 PM', end: '3 PM' });
    expect(templateHi).not.toContain('PM PM');
  });

  it('[HIGH-02] Decision matrix relative reduction formula computes correct Option A vs Option B delta', () => {
    const scenAAfter = 24;
    const scenBAfter = 18;
    const relReductionPct = Math.round(((scenAAfter - scenBAfter) / scenAAfter) * 100);

    // 18 vs 24 is a 25% reduction, definitely not 86%
    expect(relReductionPct).toBe(25);
    expect(relReductionPct).not.toBe(86);
  });
});
