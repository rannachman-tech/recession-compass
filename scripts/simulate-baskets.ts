/**
 * Exhaustive basket simulation.
 *
 * For every (region, zone) and every boundary score, verifies:
 *   1. coverage  — basket exists for every (region, zone)
 *   2. invariants — weights sum to 100, no duplicate symbols, IDs > 0
 *   3. routing   — phaseFor(score) → basketFor(zone, region) returns a basket
 *   4. math      — allocate(basket, $1000) sums back to $1000 ± rounding
 *   5. catalog   — every instrumentId resolves on eToro's public catalog
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
const TEST_SCORES: Array<[number, string]> = [
  [0, "clear-min"], [15, "clear-mid"], [29, "clear-edge"],
  [30, "watch-edge"], [45, "watch-mid"], [59, "watch-edge"],
  [60, "warning-edge"], [70, "warning-mid"], [79, "warning-edge"],
  [80, "storm-edge"], [90, "storm-mid"], [100, "storm-max"],
];
const AMOUNT = 1000;
const ROUNDING_TOLERANCE = 0.05;

interface CatalogEntry {
  InstrumentID: number;
  SymbolFull?: string;
}

async function main() {
  const problems: string[] = [];

  console.log("=".repeat(92));
  console.log("BASKET SIMULATION — exhaustive coverage of region × zone × boundary score");
  console.log("=".repeat(92));

  // --- 1. Coverage
  console.log("\n[1/5] Coverage — every (region × zone) has a basket");
  for (const r of REGIONS) {
    for (const z of ZONES) {
      const b = BASKETS_FOR_VERIFY[r]?.[z];
      if (!b) {
        problems.push(`missing basket (${r}, ${z})`);
        console.log(`  ✕ (${r}, ${z}) MISSING`);
      } else {
        console.log(
          `  ✓ (${r.padEnd(6)} ${z.padEnd(8)}) ${b.holdings.length} holdings`
        );
      }
    }
  }

  // --- 2. Invariants
  console.log("\n[2/5] Per-basket invariants — weights sum to 100, IDs > 0, no dup symbols");
  for (const r of REGIONS) {
    for (const z of ZONES) {
      const b = BASKETS_FOR_VERIFY[r]?.[z];
      if (!b) continue;
      const sum = b.holdings.reduce((s, h) => s + h.weight, 0);
      const symbols = b.holdings.map((h) => h.symbolFull);
      const issues: string[] = [];
      if (Math.abs(sum - 100) > 0.001) issues.push(`sum=${sum}`);
      if (new Set(symbols).size !== symbols.length) issues.push("duplicate symbol");
      for (const h of b.holdings) {
        if (h.instrumentId <= 0) issues.push(`bad id for ${h.ticker}`);
        if (h.weight <= 0 || h.weight > 100) issues.push(`bad weight ${h.weight}`);
      }
      if (issues.length) problems.push(`(${r},${z}) ${issues.join(", ")}`);
      const tag = issues.length ? "✕" : "✓";
      console.log(
        `  ${tag} (${r.padEnd(6)} ${z.padEnd(8)}) sum=${sum.toFixed(1).padStart(5)} n=${b.holdings.length} ${issues.join(" · ")}`
      );
    }
  }

  // --- 3. Routing — phaseFor(score) → basketFor(zone, region)
  console.log("\n[3/5] Score → zone → basket routing");
  for (const r of REGIONS) {
    let line = `  ${r.toUpperCase().padEnd(7)} `;
    for (const [score] of TEST_SCORES) {
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

  // --- 4. Allocation math
  console.log(`\n[4/5] Allocation math — $${AMOUNT} splits sum back within ±$${ROUNDING_TOLERANCE}`);
  for (const r of REGIONS) {
    for (const z of ZONES) {
      const b = BASKETS_FOR_VERIFY[r]?.[z];
      if (!b) continue;
      const a = allocate(b, AMOUNT);
      const total = Math.round(a.reduce((s, x) => s + x.dollars, 0) * 100) / 100;
      const delta = Math.abs(total - AMOUNT);
      if (delta > ROUNDING_TOLERANCE) {
        problems.push(`(${r},${z}) allocation total=${total} (delta ${delta})`);
        console.log(`  ✕ (${r.padEnd(6)} ${z.padEnd(8)}) $${total.toFixed(2)}`);
      } else {
        const min = Math.min(...a.map((x) => x.dollars));
        const max = Math.max(...a.map((x) => x.dollars));
        console.log(
          `  ✓ (${r.padEnd(6)} ${z.padEnd(8)}) $${total.toFixed(2)}  per-holding $${min.toFixed(2)}–$${max.toFixed(2)}`
        );
      }
    }
  }

  // --- 5. Catalog cross-check
  console.log("\n[5/5] Live catalog cross-check — every instrumentId resolves on eToro");
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
        problems.push(`${h.ticker} symbol drift: ${e.SymbolFull} vs ${h.symbolFull}`);
        console.log(`  ⚠ ${h.ticker.padEnd(8)} drift: catalog=${e.SymbolFull} vs ${h.symbolFull}`);
      }
    }
    if (bad === 0) {
      console.log(`  ✓ All ${holdings.length} unique holdings present on live eToro catalog`);
    }
  }

  console.log("\n" + "=".repeat(92));
  if (problems.length) {
    console.log(`❌ FAILED — ${problems.length} problem(s):`);
    for (const p of problems.slice(0, 20)) console.log(`  · ${p}`);
    process.exit(1);
  }
  console.log(
    `✅ PASSED — 16 baskets × ${REGIONS.length} regions × ${TEST_SCORES.length} score boundaries`
  );
  console.log(
    `   Total: ${REGIONS.length * TEST_SCORES.length} score→basket routings + 16 allocations + catalog check`
  );
  console.log("=".repeat(92));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
