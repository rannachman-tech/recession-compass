/**
 * Comprehensive basket simulation — runs end-to-end against every region,
 * every phase, every boundary score, and the live eToro catalog.
 *
 * Sections:
 *   1. coverage              — every (region × zone) has a basket
 *   2. invariants            — weights sum to 100, IDs > 0, no dups, no empties
 *   3. field consistency     — basket.region/zone match BASKETS keys
 *   4. phaseFor edge cases   — boundary, fractional, negative, overflow scores
 *   5. routing matrix        — phaseFor(score) → basketFor(zone, region) for all combos
 *   6. allocation math       — multiple $ amounts; each basket sums back ± rounding
 *   7. cross-basket consistency — instrumentId ↔ symbolFull is 1:1 globally
 *   8. live catalog check    — every instrumentId resolves on eToro with matching symbol
 *   9. defensive properties  — concentration limits, sane basket sizes
 *
 * Exits non-zero on any failure. No API keys needed.
 *
 * Usage:
 *   npm run simulate:baskets
 */

import { basketFor, allocate, BASKETS_FOR_VERIFY, allHoldings } from "@/lib/baskets";
import { phaseFor } from "@/lib/interpret";
import type { Zone } from "@/lib/interpret";
import type { RegionId } from "@/lib/types";

const CATALOG_URL =
  "https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments";

const REGIONS: RegionId[] = ["us", "eu", "uk", "global"];
const ZONES: Zone[] = ["clear", "watch", "warning", "storm"];

const SCORE_BOUNDARIES: Array<[number, Zone]> = [
  [-100,    "storm"],     // negative falls through to last (storm)
  [-1,      "storm"],
  [0,       "clear"],
  [0.001,   "clear"],
  [15,      "clear"],
  [29.999,  "clear"],
  [30,      "watch"],     // boundary into watch
  [30.001,  "watch"],
  [45,      "watch"],
  [59.999,  "watch"],
  [60,      "warning"],   // boundary into warning
  [70,      "warning"],
  [79.999,  "warning"],
  [80,      "storm"],     // boundary into storm
  [90,      "storm"],
  [99.999,  "storm"],
  [100,     "storm"],
  [101,     "storm"],
  [200,     "storm"],
];

const ROUTING_SCORES = [0, 15, 29, 30, 45, 59, 60, 70, 79, 80, 90, 100];
const ALLOCATION_AMOUNTS = [1000, 1, 0.10, 100000, 333, 999.99, 50, 10000];
const ROUNDING_TOLERANCE = 0.05;
const MAX_HOLDINGS_PER_BASKET = 10;
const MIN_HOLDINGS_PER_BASKET = 3;
const MAX_SINGLE_WEIGHT_WARN = 55;

interface CatalogEntry {
  InstrumentID: number;
  SymbolFull?: string;
}

async function main() {
  const problems: string[] = [];

  console.log("=".repeat(92));
  console.log("COMPREHENSIVE BASKET SIMULATION  ·  every region × every zone × every edge case");
  console.log("=".repeat(92));

  // ===== 1. COVERAGE
  console.log("\n[1/9] Coverage — every (region × zone) has a basket");
  for (const r of REGIONS) {
    for (const z of ZONES) {
      const b = BASKETS_FOR_VERIFY[r]?.[z];
      if (!b) {
        problems.push(`missing basket (${r}, ${z})`);
        console.log(`  ✕ (${r},${z}) MISSING`);
      } else {
        console.log(
          `  ✓ (${r.padEnd(6)} ${z.padEnd(8)}) ${b.holdings.length} holdings`
        );
      }
    }
  }

  // ===== 2. PER-BASKET INVARIANTS
  console.log("\n[2/9] Per-basket invariants — weights, IDs, no duplicates, sane sizes");
  for (const r of REGIONS) {
    for (const z of ZONES) {
      const b = BASKETS_FOR_VERIFY[r]?.[z];
      if (!b) continue;
      const issues: string[] = [];
      const sum = b.holdings.reduce((s, h) => s + h.weight, 0);
      if (Math.abs(sum - 100) > 0.001) issues.push(`weight sum=${sum}`);
      if (b.holdings.length === 0) issues.push("empty holdings");
      if (b.holdings.length > MAX_HOLDINGS_PER_BASKET) issues.push(`too many (${b.holdings.length})`);
      const symbols = b.holdings.map((h) => h.symbolFull);
      const ids = b.holdings.map((h) => h.instrumentId);
      if (new Set(symbols).size !== symbols.length) issues.push("duplicate symbol");
      if (new Set(ids).size !== ids.length) issues.push("duplicate id");
      for (const h of b.holdings) {
        if (h.instrumentId <= 0) issues.push(`bad-id ${h.ticker}`);
        if (h.weight <= 0) issues.push(`weight≤0 ${h.ticker}`);
        if (h.weight >= 100) issues.push(`weight≥100 ${h.ticker}`);
        if (!h.ticker.trim() || !h.symbolFull.trim() || !h.name.trim()) {
          issues.push(`empty field ${h.ticker}`);
        }
      }
      if (issues.length) problems.push(`(${r},${z}) ${issues.join(", ")}`);
      const tag = issues.length ? "✕" : "✓";
      console.log(
        `  ${tag} (${r.padEnd(6)} ${z.padEnd(8)}) sum=${sum.toFixed(1).padStart(5)} n=${b.holdings.length} ${issues.join(" · ")}`
      );
    }
  }

  // ===== 3. FIELD CONSISTENCY
  console.log("\n[3/9] Field consistency — basket.region / basket.zone match BASKETS keys");
  for (const r of REGIONS) {
    for (const z of ZONES) {
      const b = BASKETS_FOR_VERIFY[r]?.[z];
      if (!b) continue;
      const issues: string[] = [];
      if (b.region !== r) issues.push(`basket.region="${b.region}" but key="${r}"`);
      if (b.zone !== z) issues.push(`basket.zone="${b.zone}" but key="${z}"`);
      if (!b.title?.trim()) issues.push("empty title");
      if (!b.thesis?.trim()) issues.push("empty thesis");
      if (issues.length) problems.push(`(${r},${z}) ${issues.join(", ")}`);
      const tag = issues.length ? "✕" : "✓";
      console.log(
        `  ${tag} (${r.padEnd(6)} ${z.padEnd(8)}) "${b.title.slice(0, 42)}…"  ${issues.join(" · ")}`
      );
    }
  }

  // ===== 4. PHASE_FOR EDGE CASES
  console.log("\n[4/9] phaseFor edge cases — boundaries, fractions, negatives, overflows");
  for (const [score, expected] of SCORE_BOUNDARIES) {
    const got = phaseFor(score).zone;
    const tag = got === expected ? "✓" : "✕";
    if (got !== expected) {
      problems.push(`phaseFor(${score})=${got}, expected ${expected}`);
    }
    console.log(`  ${tag} score=${String(score).padEnd(8)} → ${got.padEnd(8)} (expected ${expected})`);
  }

  // ===== 5. ROUTING MATRIX
  console.log("\n[5/9] Score → basket routing — full coverage matrix (4 regions × 12 scores)");
  for (const r of REGIONS) {
    let line = `  ${r.toUpperCase().padEnd(7)}`;
    for (const score of ROUTING_SCORES) {
      const phase = phaseFor(score);
      try {
        const b = basketFor(phase.zone, r);
        if (!b) {
          problems.push(`(${r}) routing miss score=${score} zone=${phase.zone}`);
          line += ` ${score}✕`;
        } else {
          line += ` ${score}✓`;
        }
      } catch (err) {
        problems.push(`(${r}) routing error score=${score}: ${(err as Error).message}`);
        line += ` ${score}✕`;
      }
    }
    console.log(line);
  }

  // ===== 6. ALLOCATION MATH (multiple amounts)
  console.log(`\n[6/9] Allocation math — ${ALLOCATION_AMOUNTS.length} amounts × every basket`);
  for (const amt of ALLOCATION_AMOUNTS) {
    let maxDelta = 0;
    let bad = 0;
    for (const r of REGIONS) {
      for (const z of ZONES) {
        const b = BASKETS_FOR_VERIFY[r]?.[z];
        if (!b) continue;
        const a = allocate(b, amt);
        const total = Math.round(a.reduce((s, x) => s + x.dollars, 0) * 100) / 100;
        const delta = Math.abs(total - amt);
        if (delta > maxDelta) maxDelta = delta;
        if (delta > ROUNDING_TOLERANCE) {
          bad++;
          problems.push(`alloc($${amt}) on (${r},${z}) = $${total} (delta $${delta})`);
        }
      }
    }
    const tag = bad === 0 ? "✓" : "✕";
    console.log(
      `  ${tag} amount=$${String(amt).padEnd(10)} max delta=$${maxDelta.toFixed(4)}  (16 baskets, ${bad} failed)`
    );
  }

  // ===== 7. CROSS-BASKET CONSISTENCY
  console.log("\n[7/9] Cross-basket consistency — instrumentId ↔ symbolFull is 1:1 globally");
  const idToSym = new Map<number, string>();
  const symToId = new Map<string, number>();
  for (const r of REGIONS) {
    for (const z of ZONES) {
      const b = BASKETS_FOR_VERIFY[r]?.[z];
      if (!b) continue;
      for (const h of b.holdings) {
        const existingSym = idToSym.get(h.instrumentId);
        if (existingSym && existingSym !== h.symbolFull) {
          problems.push(`id=${h.instrumentId} maps to "${existingSym}" and "${h.symbolFull}"`);
        }
        idToSym.set(h.instrumentId, h.symbolFull);
        const existingId = symToId.get(h.symbolFull);
        if (existingId && existingId !== h.instrumentId) {
          problems.push(`symbol="${h.symbolFull}" maps to id ${existingId} and ${h.instrumentId}`);
        }
        symToId.set(h.symbolFull, h.instrumentId);
      }
    }
  }
  console.log(`  ✓ ${idToSym.size} unique instrumentIds, all 1:1 with symbolFull across baskets`);

  // ===== 8. LIVE CATALOG CROSS-CHECK
  console.log("\n[8/9] Live catalog cross-check — every instrumentId resolves with matching symbol");
  const res = await fetch(CATALOG_URL);
  if (!res.ok) {
    problems.push(`catalog HTTP ${res.status}`);
    console.log(`  ✕ catalog fetch failed: HTTP ${res.status}`);
  } else {
    const json = (await res.json()) as { InstrumentDisplayDatas: CatalogEntry[] };
    const cat = new Map(json.InstrumentDisplayDatas.map((it) => [it.InstrumentID, it]));
    const holdings = allHoldings();
    let bad = 0;
    for (const h of holdings) {
      const e = cat.get(h.instrumentId);
      if (!e) {
        problems.push(`${h.ticker} id=${h.instrumentId} not in catalog`);
        console.log(`  ✕ ${h.ticker.padEnd(8)} id=${h.instrumentId} not in catalog`);
        bad++;
      } else if ((e.SymbolFull ?? "").toUpperCase() !== h.symbolFull.toUpperCase()) {
        problems.push(`${h.ticker} drift: catalog="${e.SymbolFull}" vs "${h.symbolFull}"`);
        console.log(`  ⚠ ${h.ticker.padEnd(8)} drift: catalog=${e.SymbolFull} vs ${h.symbolFull}`);
        bad++;
      }
    }
    if (bad === 0) {
      console.log(`  ✓ All ${holdings.length} unique holdings present + symbols match`);
    }
  }

  // ===== 9. DEFENSIVE PROPERTIES
  console.log("\n[9/9] Defensive properties — concentration limits, sane basket sizes");
  for (const r of REGIONS) {
    for (const z of ZONES) {
      const b = BASKETS_FOR_VERIFY[r]?.[z];
      if (!b) continue;
      const issues: string[] = [];
      const maxW = Math.max(...b.holdings.map((h) => h.weight));
      if (maxW > MAX_SINGLE_WEIGHT_WARN) {
        issues.push(`max weight ${maxW}% (>${MAX_SINGLE_WEIGHT_WARN}%)`);
      }
      if (b.holdings.length < MIN_HOLDINGS_PER_BASKET) {
        problems.push(`(${r},${z}) only ${b.holdings.length} holdings (<${MIN_HOLDINGS_PER_BASKET})`);
        issues.push(`only ${b.holdings.length} holdings`);
      }
      const tag = issues.length ? "⚠" : "✓";
      console.log(
        `  ${tag} (${r.padEnd(6)} ${z.padEnd(8)}) n=${b.holdings.length} max-weight=${maxW}% ${issues.join(" · ")}`
      );
    }
  }

  // ===== FINAL
  console.log("\n" + "=".repeat(92));
  if (problems.length) {
    console.log(`❌ FAILED — ${problems.length} problem(s):`);
    for (const p of problems.slice(0, 25)) console.log(`  · ${p}`);
    process.exit(1);
  }
  const nRoutings = REGIONS.length * ROUTING_SCORES.length;
  const nAllocTests = ALLOCATION_AMOUNTS.length * 16;
  console.log(`✅ PASSED — comprehensive simulation across all dimensions:`);
  console.log(`     · 16/16 baskets × all invariants checked`);
  console.log(`     · ${SCORE_BOUNDARIES.length} phaseFor boundary + extreme score tests`);
  console.log(`     · ${nRoutings} score→basket routings (${REGIONS.length} regions × ${ROUTING_SCORES.length} boundary scores)`);
  console.log(`     · ${nAllocTests} allocation math tests (${ALLOCATION_AMOUNTS.length} amounts × 16 baskets)`);
  console.log(`     · ${idToSym.size} unique instruments cross-checked against live eToro catalog`);
  console.log(`     · cross-basket id↔symbol consistency, defensive concentration limits`);
  console.log("=".repeat(92));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
