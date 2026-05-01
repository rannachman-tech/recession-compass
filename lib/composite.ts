import type { IndicatorReading } from "./types";

/**
 * Convert a raw indicator value into a 0–100 sub-score.
 * Direction tells the function whether higher raw values are MORE recessionary
 * ("higher") or LESS recessionary ("lower"). The two anchor values calibrate
 * where the score hits 0 (calm) and 100 (alarming).
 */
export function subScore(opts: {
  value: number | null;
  calm: number; // raw value at which subScore = 0
  alarm: number; // raw value at which subScore = 100
}): number {
  const { value, calm, alarm } = opts;
  if (value === null || value === undefined || Number.isNaN(value)) return 50;
  if (calm === alarm) return 50;
  const t = (value - calm) / (alarm - calm);
  return Math.max(0, Math.min(100, t * 100));
}

/**
 * Composite is a weighted average of sub-scores.
 * Weights are expected to sum to 100; the function is forgiving if they don't.
 */
export function composite(indicators: IndicatorReading[]): {
  score: number;
  band: number;
} {
  if (indicators.length === 0) return { score: 0, band: 0 };
  const totalWeight = indicators.reduce((s, i) => s + i.weight, 0) || 1;
  const score =
    indicators.reduce((s, i) => s + i.subScore * i.weight, 0) / totalWeight;

  // Confidence band: 1.5 × stdev of the per-indicator sub-scores, weighted.
  const mean = score;
  const variance =
    indicators.reduce(
      (s, i) => s + i.weight * Math.pow(i.subScore - mean, 2),
      0
    ) / totalWeight;
  const stdev = Math.sqrt(variance);
  const band = Math.min(35, 1.5 * stdev); // cap so the band never swallows the dial

  return { score: Math.round(score), band: Math.round(band) };
}
