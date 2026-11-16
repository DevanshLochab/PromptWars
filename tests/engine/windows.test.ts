import { describe, it, expect } from 'vitest';
import { bestWindows, shouldVentilate } from '@/lib/engine/windows';

describe('Ventilation Window Finder', () => {
  // Indoor constant at 200 µg/m³
  const indoorLevels = new Array(24).fill(200);

  // Outdoor with midday trough (hours 12-15 dip below 200 down to 140-160)
  const outdoorWithTrough = new Array(24).fill(300);
  outdoorWithTrough[12] = 170;
  outdoorWithTrough[13] = 140;
  outdoorWithTrough[14] = 150;
  outdoorWithTrough[15] = 180;

  it('finds best ventilation windows when outdoor air is cleaner than indoor', () => {
    const windows = bestWindows(outdoorWithTrough, indoorLevels, {
      durationH: 2,
    });

    expect(windows.length).toBeGreaterThan(0);

    // The cleanest 2-hour window should be hours 13-15 (avg: (140+150)/2 = 145)
    expect(windows[0].startHour).toBe(13);
    expect(windows[0].endHour).toBe(15);
    expect(windows[0].avgPm25).toBeCloseTo(145.0, 1);
  });

  it('returns empty array when outdoor air is always worse and no combustion heater', () => {
    const indoorClean = new Array(24).fill(50);
    const outdoorDirty = new Array(24).fill(300);

    const windows = bestWindows(outdoorDirty, indoorClean, {
      durationH: 2,
      hasCombustionHeater: false,
    });

    expect(windows).toEqual([]);
  });

  it('respects minHour and maxHour constraints', () => {
    // Only search daytime hours 10 to 14
    const windows = bestWindows(outdoorWithTrough, indoorLevels, {
      minHour: 10,
      maxHour: 14,
      durationH: 2,
    });

    expect(windows.length).toBeGreaterThan(0);
    for (const w of windows) {
      expect(w.startHour).toBeGreaterThanOrEqual(10);
      expect(w.endHour).toBeLessThanOrEqual(15); // endHour = startHour + durationH
    }
  });

  it('combustion heater override: ALWAYS recommends ventilation even when outdoor is worse', () => {
    const indoorClean = new Array(24).fill(40);
    const outdoorDirty = new Array(24).fill(350);
    outdoorDirty[13] = 220;
    outdoorDirty[14] = 230;

    // Normal case returns empty
    const normalWindows = bestWindows(outdoorDirty, indoorClean, {
      durationH: 2,
      hasCombustionHeater: false,
    });
    expect(normalWindows).toHaveLength(0);

    // Combustion heater present: must ALWAYS return a window for CO life-safety
    const safetyWindows = bestWindows(outdoorDirty, indoorClean, {
      durationH: 2,
      hasCombustionHeater: true,
    });

    expect(safetyWindows.length).toBeGreaterThan(0);
    // Should pick the least-dirty outdoor window (hours 13-15 with avg 225)
    expect(safetyWindows[0].startHour).toBe(13);
    expect(safetyWindows[0].endHour).toBe(15);
    expect(safetyWindows[0].avgPm25).toBeCloseTo(225.0, 1);
  });

  it('shouldVentilate logic handles regular and combustion safety states', () => {
    // Regular: outdoor clean, indoor dirty → ventilate
    expect(shouldVentilate(13, 150, 250, false)).toBe(true);

    // Regular: outdoor dirty, indoor clean → do not ventilate
    expect(shouldVentilate(8, 380, 120, false)).toBe(false);

    // Combustion heater active: always ventilate to prevent fatal CO buildup
    expect(shouldVentilate(8, 380, 120, true)).toBe(true);
  });
});
