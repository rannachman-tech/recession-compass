export type Zone = "clear" | "watch" | "warning" | "storm";

export interface Phase {
  zone: Zone;
  range: string;
  min: number;
  max: number;
  label: string;
  short: string;
  color: string;
  positioning: string;
  ctaTitle: string;
  ctaBody: string;
  ctaQuery: string;
}

export const PHASES: Phase[] = [
  {
    zone: "clear",
    range: "0–30",
    min: 0,
    max: 30,
    label: "Skies are clear.",
    short: "Clear",
    color: "rgb(96, 165, 250)",
    positioning:
      "Indicators broadly benign. Risk-on tilts (broad equity, growth) tend to do well.",
    ctaTitle: "Position for the upside",
    ctaBody:
      "Skies are clear — broad-equity and growth ETFs are a common way to express a constructive view.",
    ctaQuery: "etfs",
  },
  {
    zone: "watch",
    range: "30–60",
    min: 30,
    max: 60,
    label: "Storm watch.",
    short: "Watch",
    color: "rgb(250, 204, 21)",
    positioning:
      "Some indicators flashing yellow. Quality and dividend tilts are a common defensive lean.",
    ctaTitle: "Lean toward quality",
    ctaBody:
      "Storm watch — investors often rotate toward quality, dividend and large-cap value ETFs at this stage.",
    ctaQuery: "etfs",
  },
  {
    zone: "warning",
    range: "60–80",
    min: 60,
    max: 80,
    label: "Storm warning.",
    short: "Warning",
    color: "rgb(251, 146, 60)",
    positioning:
      "Multiple indicators pointing to slowdown. Defensive sectors and gold often outperform.",
    ctaTitle: "Add defensive exposure",
    ctaBody:
      "Storm warning — utilities, consumer staples, healthcare and gold ETFs are classic late-cycle defensives.",
    ctaQuery: "etfs",
  },
  {
    zone: "storm",
    range: "80+",
    min: 80,
    max: 100,
    label: "Storm in progress.",
    short: "Storm",
    color: "rgb(239, 68, 68)",
    positioning:
      "Recession signals firing. Capital preservation: treasuries, cash equivalents, hedges.",
    ctaTitle: "Preserve capital",
    ctaBody:
      "Storm in progress — short-duration treasuries, cash and inverse / hedged ETFs are how late-cycle capital is typically parked.",
    ctaQuery: "etfs",
  },
];

export function phaseFor(score: number): Phase {
  for (const p of PHASES) {
    if (score >= p.min && score < p.max) return p;
  }
  return PHASES[PHASES.length - 1];
}

export function interpret(score: number): { label: string; zone: Zone } {
  const p = phaseFor(score);
  return { label: p.label, zone: p.zone };
}

export const ZONE_HEX: Record<Zone, string> = {
  clear: PHASES[0].color,
  watch: PHASES[1].color,
  warning: PHASES[2].color,
  storm: PHASES[3].color,
};
