'use client';

import React, { useState } from 'react';

export interface ConfirmChipProps {
  field: string;
  value: string | number | boolean;
  label?: string;
  onConfirm?: () => void;
  isConfirmed?: boolean;
  className?: string;
}

export function ConfirmChip({
  field,
  value,
  label,
  onConfirm,
  isConfirmed = false,
  className = '',
}: ConfirmChipProps) {
  const [confirmed, setConfirmed] = useState(isConfirmed);

  const handleConfirm = () => {
    setConfirmed(true);
    if (onConfirm) {
      onConfirm();
    }
  };

  const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);

  if (confirmed) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 ${className}`}
      >
        <span aria-hidden="true" className="text-emerald-600 dark:text-emerald-400">
          ✓
        </span>
        <span className="font-semibold">{label || field}:</span>
        <span>{displayValue}</span>
        <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">(confirmed)</span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 p-1 pl-2.5 rounded-full text-xs border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-2xs ${className}`}
    >
      <span className="flex items-center gap-1 font-medium">
        <span className="text-amber-500 font-bold" aria-hidden="true">
          ?
        </span>
        <span className="font-semibold text-amber-950 dark:text-amber-100">{label || field}:</span>
        <span className="font-bold">{displayValue}</span>
      </span>
      <button
        type="button"
        onClick={handleConfirm}
        className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-500 transition-colors cursor-pointer min-h-[32px] sm:min-h-[36px] flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-amber-400"
        aria-label={`Confirm estimated ${label || field} value ${displayValue}`}
      >
        Confirm
      </button>
    </div>
  );
}

export default ConfirmChip;
