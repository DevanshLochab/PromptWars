import { describe, it, expect, beforeEach } from 'vitest';
import {
  markDone,
  unmarkDone,
  getLedger,
  getWeeklyTotals,
  isActionDoneToday,
} from '@/lib/store/ledgerStore';
import { communityStore } from '@/lib/store/communityStore';
import { t } from '@/lib/i18n';
import { en } from '@/lib/i18n/en';
import { hi } from '@/lib/i18n/hi';

describe('Local Action Ledger Store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('marks an action as done and retrieves it', () => {
    const today = new Date().toISOString().slice(0, 10);
    markDone({
      actionId: 'test_action_purifier',
      date: today,
      receiptId: 'rcpt_test_1',
      memberIds: ['m1'],
      estimatedBreatheDeltaPct: 30,
      estimatedEmissionsAvoidedGrams: 20,
    });

    expect(isActionDoneToday('test_action_purifier')).toBe(true);
    const ledger = getLedger();
    expect(ledger.some((e) => e.actionId === 'test_action_purifier')).toBe(true);
  });

  it('calculates weekly totals accurately', () => {
    const totals = getWeeklyTotals();
    expect(totals.actionsDone).toBeGreaterThan(0);
    expect(totals.estimatedBreathReduction).toBeGreaterThan(0);
    expect(totals.estimatedEmissionsAvoided).toBeGreaterThanOrEqual(0);
  });

  it('unmarks an action cleanly', () => {
    const today = new Date().toISOString().slice(0, 10);
    markDone({
      actionId: 'temporary_action',
      date: today,
      receiptId: 'rcpt_temp',
      memberIds: ['m1'],
    });
    expect(isActionDoneToday('temporary_action')).toBe(true);

    unmarkDone('temporary_action', today);
    expect(isActionDoneToday('temporary_action')).toBe(false);
  });
});

describe('Community Store & Pre-seeded Data', () => {
  it('retrieves pre-seeded DELHI-GREEN-01 community with 60 households', async () => {
    const pooled = await communityStore.getPooledTotals('DELHI-GREEN-01');
    expect(pooled.communityCode).toBe('DELHI-GREEN-01');
    expect(pooled.householdsCount).toBe(60);
    expect(pooled.weeklyActionsDone).toBe(428);
    expect(pooled.weeklyPm25AvoidedGrams).toBe(3420);
    expect(pooled.topActions.length).toBeGreaterThan(0);
  });

  it('joins a new community and increments households', async () => {
    await communityStore.joinCommunity('SOUTH-DELHI-09');
    const pooled = await communityStore.getPooledTotals('SOUTH-DELHI-09');
    expect(pooled.communityCode).toBe('SOUTH-DELHI-09');
    expect(pooled.householdsCount).toBe(1);
  });

  it('provides 4 comprehensive action kits with diplomatic notices', async () => {
    const kits = await communityStore.getActionKits('DELHI-GREEN-01');
    expect(kits.length).toBe(4);

    const leafKit = kits.find((k) => k.issue === 'waste_burning');
    expect(leafKit).toBeDefined();
    expect(leafKit?.buildingNotice).toContain('COMMUNITY NOTICE');
    expect(leafKit?.whatsAppMessage).toContain('Clean Air Advisory');
    expect(leafKit?.practicalAlternatives.length).toBeGreaterThanOrEqual(2);

    const guardKit = kits.find((k) => k.issue === 'bonfires');
    expect(guardKit).toBeDefined();
    expect(guardKit?.practicalAlternatives).toBeDefined();

    const schoolKit = kits.find((k) => k.issue === 'school_idling');
    expect(schoolKit?.schoolNotice).toBeDefined();
  });

  it('submits a hotspot report with mandatory privacy and metadata', async () => {
    await communityStore.submitHotspot('DELHI-GREEN-01', {
      id: 'test_hotspot_01',
      sourceType: 'waste_burning',
      severity: 'high',
      locationDescription: 'Back gate alley near park 3',
      timestamp: new Date().toISOString(),
      contactChannel: 'CPCB Sameer',
      status: 'submitted',
    });

    const reports = communityStore.getHotspotReports();
    expect(reports.some((r) => r.id === 'test_hotspot_01')).toBe(true);
  });
});

describe('i18n Message Catalogues (EN & HI)', () => {
  it('contains at least 100 translation keys in both English and Hindi', () => {
    const enKeys = Object.keys(en);
    const hiKeys = Object.keys(hi);

    expect(enKeys.length).toBeGreaterThanOrEqual(100);
    expect(hiKeys.length).toBeGreaterThanOrEqual(100);
  });

  it('translates navigation and AQI bands accurately in English and Hindi', () => {
    expect(t('nav.today', 'en')).toBe('Today');
    expect(t('nav.today', 'hi')).toBe('आज का हाल');

    expect(t('aqi.severe', 'en')).toBe('Severe');
    expect(t('aqi.severe', 'hi')).toContain('गंभीर');
  });

  it('interpolates parameters correctly', () => {
    const textEn = t('community.joined_success', 'en', { code: 'DELHI-01' });
    expect(textEn).toBe('Successfully connected to DELHI-01 Airshed!');

    const textHi = t('community.joined_success', 'hi', { code: 'DELHI-01' });
    expect(textHi).toBe('आप सफलतापूर्वक DELHI-01 हब से जुड़ गए हैं!');
  });
});
