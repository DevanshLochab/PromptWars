import { describe, it, expect } from 'vitest';
import {
  cfmToM3h,
  roundToSignificantFigures,
  roundToNearest5Percent,
  aqiBand,
  formatRange,
  clamp,
} from '@/lib/engine/units';

describe('Unit Conversion and Utility Functions', () => {
  it('converts CFM to m³/h (multiplier × 1.699)', () => {
    expect(cfmToM3h(0)).toBe(0);
    expect(cfmToM3h(-10)).toBe(0);
    expect(cfmToM3h(100)).toBeCloseTo(169.9, 1);
    expect(cfmToM3h(200)).toBeCloseTo(339.8, 1);
  });

  it('rounds numbers to significant figures', () => {
    expect(roundToSignificantFigures(0, 2)).toBe(0);
    expect(roundToSignificantFigures(171.42857, 2)).toBe(170);
    expect(roundToSignificantFigures(26.966, 2)).toBe(27);
    expect(roundToSignificantFigures(0.00543, 2)).toBe(0.0054);
    expect(roundToSignificantFigures(1234, 3)).toBe(1230);
  });

  it('rounds percentages to nearest 5%', () => {
    expect(roundToNearest5Percent(84.27)).toBe(85);
    expect(roundToNearest5Percent(82.1)).toBe(80);
    expect(roundToNearest5Percent(17.5)).toBe(20);
    expect(roundToNearest5Percent(0)).toBe(0);
  });

  it('categorizes AQI values into correct AQI bands', () => {
    expect(aqiBand(35)).toBe('Good');
    expect(aqiBand(75)).toBe('Moderate');
    expect(aqiBand(125)).toBe('Unhealthy for Sensitive Groups');
    expect(aqiBand(175)).toBe('Unhealthy');
    expect(aqiBand(250)).toBe('Very Unhealthy');
    expect(aqiBand(380)).toBe('Hazardous');
  });

  it('formats range text with unit and bounds', () => {
    const formatted = formatRange(170, 120, 210, 'µg/m³');
    expect(formatted).toBe('170 µg/m³ [120–210 µg/m³]');
  });

  it('clamps values correctly within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
