/**
 * Saans Ventilation Window Finder
 *
 * Identifies optimal natural ventilation periods when outdoor PM2.5 is cleaner
 * than indoor PM2.5. If combustion heating (coal, charcoal, wood, unvented gas)
 * is present, ALWAYS recommends safe ventilation windows to prevent deadly
 * carbon monoxide (CO) asphyxiation.
 */

export interface BestWindowOptions {
  minHour?: number;
  maxHour?: number;
  durationH?: number;
  hasCombustionHeater?: boolean;
}

export interface VentilationWindow {
  startHour: number;
  endHour: number;
  avgPm25: number;
}

/**
 * Evaluates whether ventilation is recommended at a specific hour.
 */
export function shouldVentilate(
  hour: number,
  outdoorPm25: number,
  indoorPm25: number,
  hasCombustionHeater: boolean = false
): boolean {
  // Critical life-safety: always ventilate when combustion heating is running
  if (hasCombustionHeater) {
    return true;
  }
  return outdoorPm25 < indoorPm25;
}

/**
 * Finds contiguous hours where outdoor PM2.5 is cleaner than indoor PM2.5,
 * sorted by lowest average outdoor PM2.5 concentration.
 */
export function bestWindows(
  hourlyOutdoor: number[],
  hourlyIndoor: number[],
  options: BestWindowOptions = {}
): VentilationWindow[] {
  if (!hourlyOutdoor || hourlyOutdoor.length === 0) return [];

  const durationH = options.durationH ?? 2;
  const minHour = options.minHour ?? 0;
  const maxHour = options.maxHour ?? hourlyOutdoor.length - 1;
  const hasCombustionHeater = options.hasCombustionHeater ?? false;

  const validWindows: VentilationWindow[] = [];

  const maxStart = Math.min(maxHour - durationH + 1, hourlyOutdoor.length - durationH);

  for (let s = minHour; s <= maxStart; s++) {
    let allCleaner = true;
    let sumOutdoor = 0;

    for (let h = s; h < s + durationH; h++) {
      const outC = hourlyOutdoor[h] ?? 0;
      const inC = hourlyIndoor[h] ?? 0;
      sumOutdoor += outC;

      if (outC >= inC) {
        allCleaner = false;
      }
    }

    if (allCleaner) {
      validWindows.push({
        startHour: s,
        endHour: s + durationH,
        avgPm25: Math.round((sumOutdoor / durationH) * 10) / 10,
      });
    }
  }

  // Sort cleaner windows by lowest average PM2.5
  validWindows.sort((a, b) => a.avgPm25 - b.avgPm25);

  // If no windows where outdoor < indoor, but combustion heater is present:
  // ALWAYS return the least-polluted outdoor window(s) for life-safety ventilation
  if (validWindows.length === 0 && hasCombustionHeater) {
    let bestStart = minHour;
    let lowestAvg = Infinity;

    for (let s = minHour; s <= maxStart; s++) {
      let sumOutdoor = 0;
      for (let h = s; h < s + durationH; h++) {
        sumOutdoor += hourlyOutdoor[h] ?? 0;
      }
      const avg = sumOutdoor / durationH;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        bestStart = s;
      }
    }

    if (lowestAvg < Infinity) {
      validWindows.push({
        startHour: bestStart,
        endHour: bestStart + durationH,
        avgPm25: Math.round(lowestAvg * 10) / 10,
      });
    }
  }

  return validWindows;
}
