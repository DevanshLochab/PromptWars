/**
 * Saans Local Action Ledger Store
 * Tracks actions marked as 'done' by the user locally in localStorage.
 * No personal data is transmitted externally.
 */

export interface LedgerEntry {
  actionId: string;
  date: string; // ISO date string (YYYY-MM-DD or full ISO)
  receiptId: string;
  memberIds: string[];
  notes?: string;
  estimatedBreatheDeltaPct?: number; // e.g., 25% exposure reduction
  estimatedEmissionsAvoidedGrams?: number; // e.g., 45g PM2.5/NOx avoided
}

const LEDGER_STORAGE_KEY = 'saans_local_ledger_v1';

export function getLedger(): LedgerEntry[] {
  if (typeof window === 'undefined') {
    return getDemoLedger();
  }

  const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
  if (!raw) {
    const demo = getDemoLedger();
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(demo));
    return demo;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // fallback if malformed
  }

  return getDemoLedger();
}

export function markDone(entry: LedgerEntry): void {
  if (typeof window === 'undefined') return;

  const current = getLedger();
  // Filter out any duplicate for the same action on the same day
  const entryDay = entry.date.slice(0, 10);
  const filtered = current.filter(
    (e) => !(e.actionId === entry.actionId && e.date.slice(0, 10) === entryDay)
  );

  const updated = [entry, ...filtered];
  localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updated));

  // Trigger storage event for reactive UI in other components
  window.dispatchEvent(new Event('saans_ledger_updated'));
}

export function unmarkDone(actionId: string, dateStr?: string): void {
  if (typeof window === 'undefined') return;

  const targetDay = (dateStr || new Date().toISOString()).slice(0, 10);
  const current = getLedger();
  const updated = current.filter(
    (e) => !(e.actionId === actionId && e.date.slice(0, 10) === targetDay)
  );

  localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('saans_ledger_updated'));
}

export function isActionDoneToday(actionId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const ledger = getLedger();
  return ledger.some((e) => e.actionId === actionId && e.date.slice(0, 10) === today);
}

export function getWeeklyTotals(): {
  actionsDone: number;
  estimatedBreathReduction: number;
  estimatedEmissionsAvoided: number;
} {
  const ledger = getLedger();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoIso = oneWeekAgo.toISOString().slice(0, 10);

  const weeklyEntries = ledger.filter((e) => e.date.slice(0, 10) >= oneWeekAgoIso);

  const actionsDone = weeklyEntries.length;

  // Aggregate estimated personal exposure reduction (capped at meaningful avg)
  const totalBreathe = weeklyEntries.reduce((sum, e) => {
    return sum + (e.estimatedBreatheDeltaPct || 15);
  }, 0);
  const estimatedBreathReduction =
    actionsDone > 0 ? Math.round(totalBreathe / actionsDone) : 0;

  // Aggregate estimated community emissions avoided in grams
  const estimatedEmissionsAvoided = Math.round(
    weeklyEntries.reduce((sum, e) => {
      return sum + (e.estimatedEmissionsAvoidedGrams || 35);
    }, 0)
  );

  return {
    actionsDone,
    estimatedBreathReduction,
    estimatedEmissionsAvoided,
  };
}

function getDemoLedger(): LedgerEntry[] {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().slice(0, 10);

  return [
    {
      actionId: 'purifier_run_high_bedroom_evening',
      date: today,
      receiptId: 'rcpt_purifier_bed_01',
      memberIds: ['m_child', 'm_adult_1'],
      estimatedBreatheDeltaPct: 35,
      estimatedEmissionsAvoidedGrams: 0,
    },
    {
      actionId: 'metro_over_cab_smog_days',
      date: yesterday,
      receiptId: 'rcpt_metro_02',
      memberIds: ['m_adult_1'],
      estimatedBreatheDeltaPct: 20,
      estimatedEmissionsAvoidedGrams: 55,
    },
    {
      actionId: 'wet_mop_not_dry_sweep',
      date: twoDaysAgo,
      receiptId: 'rcpt_mop_03',
      memberIds: ['m_all'],
      estimatedBreatheDeltaPct: 15,
      estimatedEmissionsAvoidedGrams: 20,
    },
  ];
}
