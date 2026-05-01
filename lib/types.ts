export type RegionId = "us" | "eu" | "uk" | "global";

export type ThemeMode = "light" | "dark";
export type DepthMode = "plain" | "pro";

export interface Prefs {
  theme: ThemeMode;
  depth: DepthMode;
  lastRegion: RegionId;
}

export interface IndicatorReading {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  source: string;
  asOf: string;
  subScore: number;
  threshold: number;
  weight: number;
  explanation: string;
  formula: string;
  /** True when the latest observation is older than 6 months. The composite
   *  uses 50 (neutral) for stale indicators so the score isn't dragged by
   *  zombie data. The gauge surfaces a "stale" badge in Pro mode. */
  stale?: boolean;
}

export interface CompositeHistoryPoint {
  date: string;
  score: number;
}

export interface RegionData {
  region: RegionId;
  regionLabel: string;
  score: number;
  band: number;
  generatedAt: string;
  indicators: IndicatorReading[];
  history: CompositeHistoryPoint[];
  recessions: Array<{ start: string; end: string; label?: string }>;
  notes: string[];
}
