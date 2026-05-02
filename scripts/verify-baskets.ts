/**
 * Run-once verifier: confirms every ticker in every basket is searchable on
 * eToro via /market-data/search.
 *
 * Diagnostic mode: before iterating, the script first issues two probe
 * requests and dumps their raw responses, so we can SEE the shape eToro is
 * actually returning (field names, casing, whether `internalSymbolFull` /
 * `searchText` filter at all). Use the dump to fix the parser deterministically
 * rather than guessing.
 *
 * Usage:
 *   ETORO_API_KEY=xxx ETORO_USER_KEY=yyy npm run verify:baskets
 */

import { allTickers } from "@/lib/baskets";

const BASE = "https://public-api.etoro.com/api/v1";

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface VerifyResult {
  ticker: string;
  found: boolean;
  matchedSymbol?: string;
  instrumentId?: number;
  error?: string;
}

async function rawProbe(
  description: string,
  url: string,
  headers: Record<string, string>
) {
  console.log(`\n──── PROBE: ${description}`);
  console.log(`     URL: ${url}`);
  try {
    const res = await fetch(url, { headers });
    console.log(`     HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    // Show first ~3000 chars so we see structure but not flood logs
    const truncated = text.length > 3000 ? text.slice(0, 3000) + "…[truncated]" : text;
    console.log(`     BODY: ${truncated}`);
    try {
      const json = JSON.parse(text);
      // Walk top-level keys
      if (Array.isArray(json)) {
        console.log(`     SHAPE: array(len=${json.length})`);
        if (json[0] && typeof json[0] === "object") {
          console.log(`     ITEM[0] keys: ${Object.keys(json[0]).join(", ")}`);
        }
      } else if (json && typeof json === "object") {
        console.log(`     SHAPE: object keys: ${Object.keys(json).join(", ")}`);
      }
    } catch {
      console.log(`     (not JSON)`);
    }
  } catch (err) {
    console.log(`     ERROR: ${(err as Error).message}`);
  }
  console.log("");
}

/**
 * Generic exact-match search using internalSymbolFull. We try multiple
 * candidate suffixes per ticker.
 */
const US_LISTED = new Set([
  "VTI","QQQ","VEA","VWO","SCHD","VYM","BND","TIP","IEF","TLT",
  "BIL","SHV","GLD","XLU","XLP","XLV",
]);
const UCITS_SUFFIXES = ["", ".L", ".DE", ".MI", ".SW", ".AS", ".PA"];

function candidateSymbols(ticker: string): string[] {
  if (US_LISTED.has(ticker.toUpperCase())) return [`${ticker}.US`, ticker];
  return UCITS_SUFFIXES.map((s) => `${ticker}${s}`);
}

function extractList(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    for (const k of ["instruments", "items", "data", "results", "Instruments"]) {
      if (Array.isArray(o[k])) return o[k] as unknown[];
    }
  }
  return [];
}

function extractSym(it: unknown): string | undefined {
  if (!it || typeof it !== "object") return undefined;
  const o = it as Record<string, unknown>;
  for (const k of [
    "internalSymbolFull","InternalSymbolFull",
    "symbolFull","SymbolFull",
    "symbol","Symbol",
    "internalSymbol","InternalSymbol",
  ]) {
    if (typeof o[k] === "string") return o[k] as string;
  }
  return undefined;
}

function extractId(it: unknown): number | undefined {
  if (!it || typeof it !== "object") return undefined;
  const o = it as Record<string, unknown>;
  for (const k of ["instrumentId","InstrumentID","instrumentID","InstrumentId"]) {
    if (typeof o[k] === "number") return o[k] as number;
  }
  return undefined;
}

async function searchExactSymbol(
  symbol: string,
  headers: Record<string, string>
): Promise<{ instrumentId?: number; matched?: string } | null> {
  const url = `${BASE}/market-data/search?internalSymbolFull=${encodeURIComponent(symbol)}&fields=instrumentId,internalSymbolFull,symbolFull,displayname`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    const list = extractList(json);
    const SYM = symbol.toUpperCase();
    for (const item of list) {
      const sym = extractSym(item);
      if (sym && sym.toUpperCase() === SYM) {
        return { instrumentId: extractId(item), matched: sym };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function searchTicker(
  ticker: string,
  headers: Record<string, string>
): Promise<VerifyResult> {
  const tried: string[] = [];
  for (const candidate of candidateSymbols(ticker)) {
    tried.push(candidate);
    const hit = await searchExactSymbol(candidate, headers);
    if (hit) {
      return {
        ticker,
        found: true,
        matchedSymbol: hit.matched,
        instrumentId: hit.instrumentId,
      };
    }
    await sleep(40);
  }
  return { ticker, found: false, error: `no match — tried: ${tried.join(", ")}` };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const apiKey = process.env.ETORO_API_KEY ?? "";
  const userKey = process.env.ETORO_USER_KEY ?? "";
  if (!apiKey || !userKey) {
    console.error("Set ETORO_API_KEY and ETORO_USER_KEY before running.");
    process.exit(2);
  }

  const baseHeaders = (): Record<string, string> => ({
    "x-api-key": apiKey,
    "x-user-key": userKey,
    "x-request-id": uuid(),
  });

  // ---- Diagnostic probes -------------------------------------------------
  console.log("=".repeat(70));
  console.log("DIAGNOSTIC PROBES — see exactly what eToro returns");
  console.log("=".repeat(70));

  // Probe 1: known-good crypto symbol from the docs
  await rawProbe(
    "internalSymbolFull=BTC (docs example)",
    `${BASE}/market-data/search?internalSymbolFull=BTC&fields=instrumentId,internalSymbolFull,displayname`,
    baseHeaders()
  );

  // Probe 2: bare ticker
  await rawProbe(
    "internalSymbolFull=VTI",
    `${BASE}/market-data/search?internalSymbolFull=VTI&fields=instrumentId,internalSymbolFull,displayname`,
    baseHeaders()
  );

  // Probe 3: suffixed
  await rawProbe(
    "internalSymbolFull=VTI.US",
    `${BASE}/market-data/search?internalSymbolFull=VTI.US&fields=instrumentId,internalSymbolFull,displayname`,
    baseHeaders()
  );

  // Probe 4: searchText
  await rawProbe(
    "searchText=VTI",
    `${BASE}/market-data/search?searchText=VTI&fields=instrumentId,internalSymbolFull,displayname`,
    baseHeaders()
  );

  // Probe 5: no params at all (just fields) — shows default page shape
  await rawProbe(
    "no filter, fields only",
    `${BASE}/market-data/search?fields=instrumentId,internalSymbolFull,displayname`,
    baseHeaders()
  );

  console.log("=".repeat(70));
  console.log("VERIFICATION");
  console.log("=".repeat(70));

  const tickers = allTickers();
  console.log(`Verifying ${tickers.length} unique tickers across all baskets…\n`);

  const results: VerifyResult[] = [];
  for (const t of tickers) {
    const r = await searchTicker(t, baseHeaders());
    results.push(r);
    const tag = r.found ? "✓" : "✕";
    const detail = r.found
      ? `${r.matchedSymbol} (id=${r.instrumentId})`
      : (r.error ?? "");
    console.log(`  ${tag}  ${t.padEnd(8)}  ${detail}`);
    await sleep(40);
  }

  const missing = results.filter((r) => !r.found);
  console.log("");
  console.log(`Summary: ${results.length - missing.length}/${results.length} found`);
  if (missing.length > 0) {
    console.log("Missing tickers — review the diagnostic probes above to fix the parser:");
    for (const m of missing) console.log(`  ✕ ${m.ticker} — ${m.error}`);
    process.exit(1);
  }
  console.log("All baskets verified ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
