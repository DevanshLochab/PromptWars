'use client';
import { useLedgerStore } from '@/lib/store/ledgerStore';

export default function RightRail() {
  const ledger = useLedgerStore();
  const aqi = ledger?.currentAQI ?? 167;
  const band = aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 150 ? 'Unhealthy for Sensitive Groups' : aqi <= 200 ? 'Unhealthy' : 'Very Unhealthy';
  const color = aqi <= 50 ? 'var(--success)' : aqi <= 100 ? '#FBB040' : aqi <= 150 ? '#FF7E00' : aqi <= 200 ? 'var(--danger)' : '#7E0023';

  return (
    <aside className="w-[280px] flex-shrink-0 sticky top-0 h-dvh border-l border-[var(--border)] bg-[var(--surface)] p-4 overflow-y-auto">
      <div className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4 mb-4">
        <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide mb-1">Air Now · US AQI</p>
        <p className="text-5xl font-bold" style={{ color }}>{aqi}</p>
        <p className="text-sm font-semibold mt-1" style={{ color }}>{band}</p>
      </div>
      <div className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
        <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wide mb-2">Best Times Today</p>
        <p className="text-sm text-[var(--text)]">Morning: 6–8 AM</p>
        <p className="text-sm text-[var(--text)]">Evening: 5–7 PM</p>
      </div>
    </aside>
  );
}

export { RightRail };
