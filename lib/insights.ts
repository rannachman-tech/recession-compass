/**
 * Heuristic insights picker. Given the per-indicator readings for a region,
 * it picks 1-3 facts worth flagging:
 *
 *   - "concern"     — the live indicator with the highest sub-score
 *   - "reassurance" — the live indicator with the lowest sub-score (and
 *                     non-trivial weight)
 *   - "notable"     — anything else worth a one-liner: a value beyond a
 *                     historical extreme, or a Sahm-rule reading near trigger.
 *   - "stale"       — only if any indicator is still flagged stale
 *
 * The picker is pure (no I/O) so it can be unit-tested and reused for the
 * Groq prompt + the templated fallback prose.
 */

import type { IndicatorReading, InsightPoint, RegionId } from "./types";
import { phaseFor } from "./interpret";

export interface PickedFacts {
  region: RegionId;
  regionLabel: string;
  score: number;
  zoneShort: string;
  zoneLabel: string;
  points: InsightPoint[];
}

export function pickFacts(
  region: RegionId,
  regionLabel: string,
  score: number,
  indicators: IndicatorReading[]
): PickedFacts {
  const phase = phaseFor(score);
  const live = indicators.filter((i) => !i.stale && i.value !== null);
  const stale = indicators.filter((i) => i.stale);

  const points: InsightPoint[] = [];

  // Top concern: highest sub-score, only if meaningfully elevated (>=40)
  const sorted = [...live].sort((a, b) => b.subScore - a.subScore);
  const top = sorted[0];
  if (top && top.subScore >= 40) {
    points.push({
      kind: "concern",
      label: top.label,
      value: fmt(top),
      why: `${top.label} is the loudest signal here at sub-score ${top.subScore}. ${shortRationale(top)}`,
    });
  }

  // Reassurance: lowest sub-score among the meaningful contributors (weight >= 10).
  const calmCandidates = live.filter((i) => i.weight >= 10).sort((a, b) => a.subScore - b.subScore);
  const calm = calmCandidates[0];
  if (calm && calm.subScore <= 25 && (!top || calm.id !== top.id)) {
    points.push({
      kind: "reassurance",
      label: calm.label,
      value: fmt(calm),
      why: `${calm.label} is reassuringly calm at sub-score ${calm.subScore}, holding the composite down.`,
    });
  }

  // Notable: a Sahm reading >= 0.3 (within sight of trigger), or a yield-curve flip.
  const sahm = indicators.find((i) => i.id === "sahm");
  if (
    sahm &&
    sahm.value !== null &&
    sahm.value >= 0.3 &&
    (!top || sahm.id !== top.id) &&
    (!calm || sahm.id !== calm.id)
  ) {
    points.push({
      kind: "notable",
      label: "Sahm rule",
      value: `${sahm.value.toFixed(2)}pp`,
      why: `The Sahm reading is ${sahm.value.toFixed(2)}pp — within striking distance of the 0.50pp recession trigger.`,
    });
  }

  // Stale call-out (only at most one)
  if (stale.length > 0) {
    points.push({
      kind: "stale",
      label: stale.length === 1 ? stale[0].label : `${stale.length} indicators`,
      value: stale.length === 1 ? stale[0].asOf : `${stale.length} stale`,
      why: `${
        stale.length === 1 ? stale[0].label : `${stale.length} indicators`
      } excluded from the composite — latest reading too old to trust.`,
    });
  }

  return {
    region,
    regionLabel,
    score,
    zoneShort: phase.short,
    zoneLabel: phase.label,
    points: points.slice(0, 3),
  };
}

/** Templated paragraph used when Groq is unavailable. Slightly stiff but always honest. */
export function fallbackParagraph(facts: PickedFacts): string {
  const opener =
    facts.score < 30
      ? `${facts.regionLabel} is sitting in clear-skies territory at ${facts.score}/100 — the composite reads benign.`
      : facts.score < 60
        ? `${facts.regionLabel} is on storm watch at ${facts.score}/100 — some indicators are flashing yellow.`
        : facts.score < 80
          ? `${facts.regionLabel} is in storm-warning territory at ${facts.score}/100 — multiple indicators pointing to a slowdown.`
          : `${facts.regionLabel} is at storm-in-progress at ${facts.score}/100 — recession signals firing.`;

  const body = facts.points
    .map((p) => p.why.replace(/\.$/, ""))
    .join(". ");

  const closer = facts.score < 60
    ? "Capital at risk; not financial advice."
    : "This is a calibrated severity index, not a forecast — capital at risk; not financial advice.";

  return `${opener} ${body}. ${closer}`;
}

// ---------- helpers ----------

function fmt(i: IndicatorReading): string {
  if (i.value === null) return "—";
  const sign = i.unit === "pp" && i.value > 0 ? "+" : "";
  return `${sign}${i.value.toFixed(2)}${i.unit}`;
}

function shortRationale(i: IndicatorReading): string {
  switch (i.id) {
    case "yield_curve":
      return "Inverted curves have preceded every US recession since 1970.";
    case "sahm":
      return "The Sahm rule fires within months of every recession start.";
    case "claims":
      return "Sustained YoY rises in initial claims typically precede contractions.";
    case "ism_proxy":
    case "ip":
      return "A negative print typically aligns with a manufacturing recession.";
    case "lei":
    case "cli":
    case "cn_cli":
    case "jp_cli":
      return "Below 100 = below trend on the OECD Composite Leading Indicator.";
    case "unemployment":
      return "Sustained YoY rises above ~+0.5pp are rare outside of recessions.";
    case "gdp":
      return "Direct measure of contraction, but lagging.";
    case "sentiment":
      return "Sub-70 readings have historically clustered around recessions.";
    case "cpi":
      return "Inflation shocks tighten policy and can pull the economy into recession.";
    case "bank_rate":
      return "Sharp rises over a year have historically been followed by contractions.";
    default:
      return "";
  }
}
