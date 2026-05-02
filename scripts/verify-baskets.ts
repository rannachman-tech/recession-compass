/**
 * Run-once verifier: every ticker in lib/baskets.ts is checked against
 * eToro's PUBLIC instrument catalog. No API keys needed — the catalog
 * is served unauthenticated from api.etorostatic.com.
 *
 * For each holding we already store the eToro symbolFull and
 * instrumentId. The verifier confirms (a) the instrumentId exists in
 * the catalog and (b) its SymbolFull still matches what we have on
 * file (catches eToro renaming a fund or delisting it).
 *
 * Usage:
 *   npm run verify:baskets
 */

import { allHoldings } from "@/lib/baskets";

const CATALOG_URL =
  "https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments";

interface CatalogEntry {
  InstrumentID: number;
  SymbolFull?: string;
  InstrumentDisplayName?: string;
}

interface CatalogResponse {
  InstrumentDisplayDatas: CatalogEntry[];
}

async function fetchCatalog(): Promise<Map<number, CatalogEntry>> {
  const res = await fetch(CATALOG_URL);
  if (!res.ok) throw new Error(`catalog HTTP ${res.status}`);
  const json = (await res.json()) as CatalogResponse;
  const m = new Map<number, CatalogEntry>();
  for (const it of json.InstrumentDisplayDatas) {
    m.set(it.InstrumentID, it);
  }
  return m;
}

async function main() {
  console.log("Fetching eToro public instrument catalog…");
  const catalog = await fetchCatalog();
  console.log(`Catalog has ${catalog.size.toLocaleString()} instruments.\n`);

  const holdings = allHoldings();
  console.log(`Checking ${holdings.length} unique baskets-holdings:\n`);

  const fail: string[] = [];
  for (const h of holdings) {
    const entry = catalog.get(h.instrumentId);
    if (!entry) {
      console.log(`  ✕  ${h.ticker.padEnd(8)} id=${h.instrumentId} — NOT IN CATALOG (delisted or wrong id)`);
      fail.push(`${h.ticker} (${h.symbolFull}, id=${h.instrumentId}) missing from catalog`);
      continue;
    }
    const sym = (entry.SymbolFull ?? "").toUpperCase();
    const want = h.symbolFull.toUpperCase();
    if (sym !== want) {
      console.log(`  ⚠  ${h.ticker.padEnd(8)} id=${h.instrumentId} — symbol drift: catalog has "${entry.SymbolFull}", we expect "${h.symbolFull}"`);
      fail.push(`${h.ticker} symbol drift: catalog "${entry.SymbolFull}" vs expected "${h.symbolFull}"`);
      continue;
    }
    console.log(`  ✓  ${h.ticker.padEnd(8)} id=${h.instrumentId.toString().padEnd(6)} ${entry.SymbolFull?.padEnd(14)} — ${entry.InstrumentDisplayName}`);
  }

  console.log("");
  console.log(`Summary: ${holdings.length - fail.length}/${holdings.length} verified`);
  if (fail.length > 0) {
    console.log("\nFAIL:");
    for (const f of fail) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("All baskets verified ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
