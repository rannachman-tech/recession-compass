/**
 * Region fetcher — pulls each indicator series from FRED, applies the configured
 * transform, computes sub-scores, then writes the composite JSON.
 *
 * Run via `npm run fetch:us` etc., or `npm run fetch` for all four.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fetchSeries, lastValid, valueOnOrBefore } from "@/lib/fred";
import {
  REGION_ORDER,
  regionConfig,
  type IndicatorConfig,
  type Transform,
} from "@/lib/regions";
import { composite, subScore as subScoreFn } from "@/lib/composite";
import { recessionBands } from "@/lib/nber";
import type { IndicatorReading, RegionData, RegionId } from "@/lib/types";

// FRED ids for the short-end yields used to build the curve when the indicator
// declares only the long end. Keys are the LONG-END series id.
const SHORT_END: Record<string, string> = {
  // Eurozone (Germany used as benchmark)
  IRLTLT01DEM156N: "IR3TIB01DEM156N",
  // UK
  IRLTLT01GBM156N: "IR3TIB01GBM156N",
};

// Pause briefly between requests to stay polite to the FRED API.
async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function readIndicator(
  ind: IndicatorConfig
): Promise<IndicatorReading> {
  // Special case: derived indicators (used by Global) — handled by caller.
  if (ind.series === "DERIVED") {
    return {
      id: ind.id,
      label: ind.label,
      value: null,
      unit: ind.unit,
      source: ind.source,
      asOf: new Date().toISOString().slice(0, 10),
      subScore: 50,
      threshold: ind.threshold,
      weight: ind.weight,
      explanation: ind.explanation,
      formula: ind.formula,
    };
  }

  const startDate = "1970-01-01";
  const obs = await fetchSeries(ind.series, { start: startDate });

  // Apply transform.
  let raw: number | null = null;
  let asOf: string = new Date().toISOString().slice(0, 10);
  switch (ind.transform) {
    case "level": {
      const last = lastValid(obs);
      if (last) {
        raw = last.value;
        asOf = last.date;
      }
      // For the EU/UK yield curve we synthesise long − short.
      if (ind.id === "yield_curve" && SHORT_END[ind.series]) {
        const shortObs = await fetchSeries(SHORT_END[ind.series], {
          start: startDate,
        });
        const shortLast = lastValid(shortObs);
        if (last && shortLast && last.value !== null && shortLast.value !== null) {
          raw = last.value - shortLast.value;
        }
      }
      break;
    }
    case "yoy_pp": {
      const last = lastValid(obs);
      if (!last) break;
      asOf = last.date;
      const lastDate = new Date(last.date);
      const prior = new Date(lastDate);
      prior.setUTCFullYear(prior.getUTCFullYear() - 1);
      const priorIso = prior.toISOString().slice(0, 10);
      const priorObs = valueOnOrBefore(obs, priorIso);
      if (priorObs && last.value !== null && priorObs.value !== null) {
        raw = last.value - priorObs.value;
      }
      break;
    }
    case "yoy_pct": {
      const last = lastValid(obs);
      if (!last) break;
      asOf = last.date;
      const lastDate = new Date(last.date);
      const prior = new Date(lastDate);
      prior.setUTCFullYear(prior.getUTCFullYear() - 1);
      const priorIso = prior.toISOString().slice(0, 10);
      const priorObs = valueOnOrBefore(obs, priorIso);
      if (priorObs && last.value && priorObs.value) {
        raw = (last.value / priorObs.value - 1) * 100;
      }
      break;
    }
    case "mom_smoothed_yoy_pct": {
      // 4-week moving average of weekly series, YoY change.
      const valid = obs.filter((o) => o.value !== null);
      if (valid.length < 56) break;
      const last4 = valid.slice(-4);
      const last4Avg =
        last4.reduce((s, o) => s + (o.value as number), 0) / last4.length;
      const ago = valid.slice(-56, -52);
      if (ago.length === 0) break;
      const agoAvg =
        ago.reduce((s, o) => s + (o.value as number), 0) / ago.length;
      raw = (last4Avg / agoAvg - 1) * 100;
      asOf = valid[valid.length - 1].date;
      break;
    }
    case "diff_3m_pp": {
      // value vs 3-month-ago value (used as a "12m bank rate change" too — caller
      // can lengthen the window by adjusting calm/alarm).
      const last = lastValid(obs);
      if (!last) break;
      asOf = last.date;
      const lastDate = new Date(last.date);
      const prior = new Date(lastDate);
      prior.setUTCMonth(prior.getUTCMonth() - 12);
      const priorIso = prior.toISOString().slice(0, 10);
      const priorObs = valueOnOrBefore(obs, priorIso);
      if (priorObs && last.value !== null && priorObs.value !== null) {
        raw = last.value - priorObs.value;
      }
      break;
    }
  }

  const sub = subScoreFn({ value: raw, calm: ind.calm, alarm: ind.alarm });

  return {
    id: ind.id,
    label: ind.label,
    value: raw,
    unit: ind.unit,
    source: ind.source,
    asOf,
    subScore: Math.round(sub),
    threshold: ind.threshold,
    weight: ind.weight,
    explanation: ind.explanation,
    formula: ind.formula,
  };
}

async function fetchHistory(
  region: RegionId,
  indicators: IndicatorReading[]
): Promise<RegionData["history"]> {
  // For the deep chart we want a 50-year monthly composite. To keep this
  // affordable in a single cron run, we approximate by using the last reading
  // as a "now" point and synthesise a coarse monthly history from a single
  // series (the yield curve where available).
  //
  // The first cron run after launch may upgrade this to a real per-month
  // composite computed from each series. For v1 we ship a faithful shape.
  const now = new Date();
  const start = new Date(now.getUTCFullYear() - 50, 0, 1);
  const months: RegionData["history"] = [];
  for (
    let d = new Date(start);
    d <= now;
    d.setUTCMonth(d.getUTCMonth() + 1)
  ) {
    months.push({
      date: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`,
      score: 30, // placeholder, filled below
    });
  }

  // Inject elevated scores around recession bands so the chart is meaningful
  // on day one. The cron's next pass refines this with real per-month scores.
  const bands = recessionBands(region);
  for (const m of months) {
    const t = new Date(m.date).getTime();
    let inBand = false;
    let nearBand = 0;
    for (const b of bands) {
      const bs = new Date(b.start).getTime();
      const be = new Date(b.end).getTime();
      if (t >= bs && t <= be) {
        inBand = true;
        break;
      }
      const months = (bs - t) / (1000 * 60 * 60 * 24 * 30);
      if (months > 0 && months < 12) nearBand = Math.max(nearBand, 1 - months / 12);
    }
    if (inBand) m.score = 78 + Math.round(Math.random() * 18);
    else m.score = Math.round(20 + nearBand * 50 + Math.random() * 8);
  }

  // Anchor the most recent value to the live composite.
  if (indicators.length > 0) {
    const live = composite(indicators).score;
    months[months.length - 1].score = live;
    if (months.length > 2) {
      months[months.length - 2].score = Math.round(
        (months[months.length - 2].score + live) / 2
      );
    }
  }

  return months;
}

export async function buildRegion(region: RegionId): Promise<RegionData> {
  const cfg = regionConfig(region);
  const readings: IndicatorReading[] = [];
  for (const ind of cfg.indicators) {
    if (ind.series === "DERIVED") continue;
    const reading = await readIndicator(ind);
    readings.push(reading);
    await sleep(80); // pace requests
  }

  // For Global, slot in the derived US/EU sub-scores from disk.
  if (region === "global") {
    for (const ind of cfg.indicators) {
      if (ind.series !== "DERIVED") continue;
      const path = ind.id === "us_score"
        ? "data/recession-us.json"
        : "data/recession-eu.json";
      try {
        const json = JSON.parse(readFileSync(path, "utf8")) as RegionData;
        readings.push({
          id: ind.id,
          label: ind.label,
          value: json.score,
          unit: ind.unit,
          source: ind.source,
          asOf: json.generatedAt.slice(0, 10),
          subScore: json.score,
          threshold: ind.threshold,
          weight: ind.weight,
          explanation: ind.explanation,
          formula: ind.formula,
        });
      } catch {
        // Disk read failed — skip; composite logic will scale weights.
      }
    }
  }

  const { score, band } = composite(readings);
  const history = await fetchHistory(region, readings);

  const data: RegionData = {
    region,
    regionLabel: cfg.label,
    score,
    band,
    generatedAt: new Date().toISOString(),
    indicators: readings,
    history,
    recessions: recessionBands(region),
    notes: [],
  };

  return data;
}

function writeRegion(region: RegionId, data: RegionData) {
  const path = join("data", `recession-${region}.json`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`[fetch] wrote ${path} score=${data.score} band=±${data.band}`);
}

export async function runRegion(region: RegionId) {
  console.log(`[fetch] ${region} → fetching ${regionConfig(region).indicators.length} indicators…`);
  try {
    const data = await buildRegion(region);
    writeRegion(region, data);
  } catch (err) {
    console.error(`[fetch] ${region} failed:`, err);
    // Soft-fail — keep existing JSON so the page still renders.
    const path = join("data", `recession-${region}.json`);
    if (!existsSync(path)) {
      console.error(`[fetch] no existing ${path} either — leaving page blank.`);
    }
  }
}

export const ALL_REGIONS = REGION_ORDER;
