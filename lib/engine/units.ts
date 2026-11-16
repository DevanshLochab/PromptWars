/**
 * Unit conversion and mathematical formatting utilities for Saans Engine.
 */

/**
 * Converts Clean Air Delivery Rate from CFM (cubic feet per minute) to m³/h.
 * 1 CFM ≈ 1.699011 m³/h.
 */
export function cfmToM3h(cfm: number): number {
  if (cfm <= 0) return 0;
  return cfm * 1.699;
}

/**
 * Rounds a number to a given count of significant figures.
 */
export function roundToSignificantFigures(n: number, sf: number = 2): number {
  if (!isFinite(n) || n === 0) return 0;
  const d = Math.ceil(Math.log10(Math.abs(n)));
  const power = sf - d;
  const magnitude = Math.pow(10, power);
  return Math.round(n * magnitude) / magnitude;
}

/**
 * Rounds a percentage to the nearest 5% (e.g. 84.2% -> 85%).
 */
export function roundToNearest5Percent(n: number): number {
  if (!isFinite(n)) return 0;
  return Math.round(n / 5) * 5;
}

/**
 * Returns the standard EPA / CPCB AQI band descriptor.
 */
export function aqiBand(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Formats a value with its uncertainty range and unit.
 * E.g., "170 µg/m³ [120–210 µg/m³]"
 */
export function formatRange(
  value: number,
  low: number,
  high: number,
  unit: string
): string {
  return `${value} ${unit} [${low}–${high} ${unit}]`;
}

/**
 * Clamps a number between min and max bounds.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
