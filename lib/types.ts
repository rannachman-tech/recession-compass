export type RegionId = "us" | "eu" | "uk" | "global";

export type ThemeMode = "light" | "dark";
export type DepthMode = "plain" | "pro";

export interface Prefs {
  theme: ThemeMode;
  depth: DepthMode;
  lastRegion: RegionId;
}

export interface IndicatorReading {
  /** Stable id, matches the config in lib/regions.ts */
  id: string;
  /** Human label, e.g. "Yield curve (10y–2y)" */
  label: string;
  /** Current raw value, e.g. -0.42 (yield curve in pp) */
  value: number | null;
  /** Units suffix for display, e.g. "pp", "%", "k", "" */
  unit: string;
  /** Source citation, e.g. "FRED: T10Y2Y" */
  source: string;
  /** As-of date (ISO 8601) */
  asOf: string;
  /** 0–100 sub-score for this indicator (higher = more recessionary) */
  subScore: number;
  /** Threshold value at which the indicator flips into "concern" territory */
  threshold: number;
  /** Weight (0–100) used in the composite */
  weight: number;
  /** One-sentence plain-English explanation */
  explanation: string;
  /** Formula description, shown in Pro mode */
  formula: string;
}

export interface CompositeHistoryPoint {
  /** YYYY-MM-DD */
  date: string;
  /** 0–100 composite score */
  score: number;
}

export interface RegionData {
  region: RegionId;
  /** Human name, e.g. "United States" */
  regionLabel: string;
  /** Composite 0–100 */
  score: number;
  /** Confidence band (±) on the needle */
  band: number;
  /** When the cron last ran (ISO) */
  generatedAt: string;
  /** Per-indicator readings */
  indicators: IndicatorReading[];
  /** Long history for the deep chart, monthly resolution */
  history: CompositeHistoryPoint[];
  /** Recession bands to overlay on the deep chart */
  recessions: Array<{ start: string; end: string; label?: string }>;
  /** Optional notes, e.g. partial-data warning */
  notes: string[];
}
