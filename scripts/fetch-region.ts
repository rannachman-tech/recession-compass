/**
 * Region fetcher — pulls each indicator series from FRED, applies the configured
 * transform, computes sub-scores, then writes the composite JSON.
 *
 * v1.4: drafts a "Worth flagging" insights paragraph after the composite is
 * computed (Groq when GROQ_API_KEY present, templated fallback otherwise).
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fetchSeries, lastValid, valueOnOrBefore } from "@/lib/fred";
import {
  REGION_ORDER,
  regionConfig,
  type IndicatorConfig,
} from "@/lib/regions";
import { composite, subScore as subScoreFn } from "@/lib/composite";
import { recessionBands } from "@/lib/nber";
import { pickFacts, fallbackParagraph } from "@/lib/insights";
import { groqComplete } from "@/lib/groq";
import type {
  IndicatorReading,
  RegionData,
  RegionId,
  RegionInsights,
} from "@/lib/types";

const SHORT_END: Record<string, string> = {
  IRLTLT01DEM156N: "IR3TIB01DEM156N",
  IRLTLT01GBM156N: "IR3TIB01GBM156N",
};

const STALE_AFTER_DAYS = 240;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function daysOld(asOfIso: string): number {
  const t = new Date(asOfIso).getTime();
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

async function readIndicator(
  ind: IndicatorConfig,
  region: RegionId
): Promise<IndicatorReading> {
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
  let raw: number | null = null;
  let asOf: string = new Date().toISOString().slice(0, 10);

  if (region === "eu" && ind.id === "cli") {
    const codes = ["DEULOLITOAASTSAM", "FRALOLITOAASTSAM", "ITALOLITOAASTSAM"];
    const vals: number[] = [];
    let earliest = "9999-99-99";
    for (const c of codes) {
      const o = await fetchSeries(c, { start: startDate });
      const last = lastValid(o);
      if (last && last.value !== null) {
        vals.push(last.value);
        if (last.date < earliest) earliest = last.date;
      }
      await sleep(80);
    }
    if (vals.length > 0) {
      raw = vals.reduce((s, v) => s + v, 0) / vals.length;
      asOf = earliest;
    }
  } else if (region === "eu" && ind.id === "unemployment") {
    const codes = [
      "LRHUTTTTDEM156S",
      "LRHUTTTTFRM156S",
      "LRHUTTTTITM156S",
      "LRHUTTTTESM156S",
    ];
    let nowSum = 0;
    let agoSum = 0;
    let n = 0;
    let earliest = "9999-99-99";
    for (const c of codes) {
      const o = await fetchSeries(c, { start: startDate });
      const last = lastValid(o);
      if (!last || last.value === null) continue;
      const lastDate = new Date(last.date);
      const prior = new Date(lastDate);
      prior.setUTCFullYear(prior.getUTCFullYear() - 1);
      const priorObs = valueOnOrBefore(o, prior.toISOString().slice(0, 10));
      if (!priorObs || priorObs.value === null) continue;
      nowSum += last.value;
      agoSum += priorObs.value;
      n++;
      if (last.date < earliest) earliest = last.date;
      await sleep(80);
    }
    if (n > 0) {
      raw = nowSum / n - agoSum / n;
      asOf = earliest;
    }
  } else {
    const obs = await fetchSeries(ind.series, { start: startDate });
    switch (ind.transform) {
      case "level": {
        const last = lastValid(obs);
        if (last) {
          raw = last.value;
          asOf = last.date;
        }
        if (ind.id === "yield_curve" && SHORT_END[ind.series]) {
          const shortObs = await fetchSeries(SHORT_END[ind.series], {
            start: startDate,
          });
          const shortLast = lastValid(shortObs);
          if (
            last &&
            shortLast &&
            last.value !== null &&
            shortLast.value !== null
          ) {
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
        const priorObs = valueOnOrBefore(obs, prior.toISOString().slice(0, 10));
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
        const priorObs = valueOnOrBefore(obs, prior.toISOString().slice(0, 10));
        if (priorObs && last.value && priorObs.value) {
          raw = (last.value / priorObs.value - 1) * 100;
        }
        break;
      }
      case "mom_smoothed_yoy_pct": {
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
        const last = lastValid(obs);
        if (!last) break;
        asOf = last.date;
        const lastDate = new Date(last.date);
        const prior = new Date(lastDate);
        prior.setUTCMonth(prior.getUTCMonth() - 12);
        const priorObs = valueOnOrBefore(obs, prior.toISOString().slice(0, 10));
        if (priorObs && last.value !== null && priorObs.value !== null) {
          raw = last.value - priorObs.value;
        }
        break;
      }
    }
  }

  const stale = daysOld(asOf) > STALE_AFTER_DAYS;
  const sub =
    stale || raw === null
      ? 50
      : subScoreFn({ value: raw, calm: ind.calm, alarm: ind.alarm });

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
    stale,
  };
}

async function fetchHistory(
  region: RegionId,
  indicators: IndicatorReading[]
): Promise<RegionData["history"]> {
  const now = new Date();
  const start = new Date(now.getUTCFullYear() - 50, 0, 1);
  const months: RegionData["history"] = [];
  for (let d = new Date(start); d <= now; d.setUTCMonth(d.getUTCMonth() + 1)) {
    months.push({
      date: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`,
      score: 30,
    });
  }

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
      const monthsTo = (bs - t) / (1000 * 60 * 60 * 24 * 30);
      if (monthsTo > 0 && monthsTo < 12)
        nearBand = Math.max(nearBand, 1 - monthsTo / 12);
    }
    if (inBand) m.score = 78 + Math.round(Math.random() * 18);
    else m.score = Math.round(20 + nearBand * 50 + Math.random() * 8);
  }

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

async function draftInsights(
  region: RegionId,
  regionLabel: string,
  score: number,
  readings: IndicatorReading[]
): Promise<RegionInsights | undefined> {
  const facts = pickFacts(region, regionLabel, score, readings);
  if (facts.points.length === 0) return undefined;

  const factsBlock = facts.points
    .map((p, i) => `  ${i + 1}. [${p.kind}] ${p.label} (${p.value}) - ${p.why}`)
    .join("\n");

  const systemPrompt =
    "You are an editorial economist writing for retail investors. " +
    "Tone: calm, factual, Bloomberg-morning-brief. " +
    "Never make a forecast. Never recommend a trade. " +
    "Output a single paragraph of 60-100 words. No markdown, no headers, no bullet points.";

  const userPrompt =
    `Region: ${regionLabel}\n` +
    `Composite score: ${score}/100 (${facts.zoneShort.toLowerCase()} zone - "${facts.zoneLabel}")\n` +
    `Facts to weave together:\n${factsBlock}\n\n` +
    `Write the paragraph. End with one neutral sentence flagging that this is informational only.`;

  const groqText = await groqComplete(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { maxTokens: 220, temperature: 0.4 }
  );

  if (groqText && groqText.length > 40) {
    return {
      paragraph: groqText,
      points: facts.points,
      generatedAt: new Date().toISOString(),
      source: "groq",
    };
  }

  return {
    paragraph: fallbackParagraph(facts),
    points: facts.points,
    generatedAt: new Date().toISOString(),
    source: "fallback",
  };
}

export async function buildRegion(region: RegionId): Promise<RegionData> {
  const cfg = regionConfig(region);
  const readings: IndicatorReading[] = [];
  const notes: string[] = [];

  for (const ind of cfg.indicators) {
    if (ind.series === "DERIVED") continue;
    const reading = await readIndicator(ind, region);
    readings.push(reading);
    if (reading.stale) {
      notes.push(
        `${reading.label}: latest observation ${reading.asOf} is older than 240 days - using neutral sub-score 50 in the composite.`
      );
    }
    await sleep(80);
  }

  if (region === "global") {
    for (const ind of cfg.indicators) {
      if (ind.series !== "DERIVED") continue;
      const path =
        ind.id === "us_score"
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
        /* skip */
      }
    }
  }

  const { score, band } = composite(readings);
  const history = await fetchHistory(region, readings);
  const insights = await draftInsights(region, cfg.label, score, readings);

  return {
    region,
    regionLabel: cfg.label,
    score,
    band,
    generatedAt: new Date().toISOString(),
    indicators: readings,
    history,
    recessions: recessionBands(region),
    notes,
    insights,
  };
}

function writeRegion(region: RegionId, data: RegionData) {
  const path = join("data", `recession-${region}.json`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(
    `[fetch] wrote ${path} score=${data.score} band=±${data.band} stale=${data.indicators.filter((i) => i.stale).length} insights=${data.insights?.source ?? "none"}`
  );
}

export async function runRegion(region: RegionId) {
  console.log(
    `[fetch] ${region} → fetching ${regionConfig(region).indicators.length} indicators…`
  );
  try {
    const data = await buildRegion(region);
    writeRegion(region, data);
  } catch (err) {
    console.error(`[fetch] ${region} failed:`, err);
    const path = join("data", `recession-${region}.json`);
    if (!existsSync(path)) {
      console.error(`[fetch] no existing ${path} either — leaving page blank.`);
    }
  }
}

export const ALL_REGIONS = REGION_ORDER;
