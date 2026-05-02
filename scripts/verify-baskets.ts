/**
 * Run-once verifier: confirms every ticker in every basket is searchable on
 * eToro via /market-data/search. Prints a clean report of ✓ / ✕ per ticker.
 *
 * Usage:
 *   ETORO_API_KEY=xxx ETORO_USER_KEY=yyy npm run verify:baskets
 *
 * Exits non-zero if any ticker is missing — useful as a CI guard before
 * merging basket changes to main.
 */

import { BASKETS_FOR_VERIFY, allTickers } from "@/lib/baskets";

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

async function searchTicker(
  ticker: string,
  headers: Record<string, string>
): Promise<VerifyResult> {
  const url = `${BASE}/market-data/search?internalSymbolFull=${encodeURIComponent(ticker)}&fields=instrumentId,internalSymbolFull,displayname`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      return { ticker, found: false, error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as unknown;
    let list: unknown[] = [];
    if (Array.isArray(json)) list = json;
    else if (json && typeof json === "object") {
      const o = json as Record<string, unknown>;
      if (Array.isArray(o.instruments)) list = o.instruments as unknown[];
      else if (Array.isArray(o.items)) list = o.items as unknown[];
      else if (Array.isArray(o.data)) list = o.data as unknown[];
    }
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const it = item as Record<string, unknown>;
      const sym = (it.internalSymbolFull ?? it.InternalSymbolFull) as string | undefined;
      if (sym && sym.toUpperCase() === ticker.toUpperCase()) {
        const id = (it.instrumentId ?? it.InstrumentID) as number | undefined;
        return { ticker, found: true, matchedSymbol: sym, instrumentId: id };
      }
    }
    return { ticker, found: false, error: list.length ? `no exact match in ${list.length} result(s)` : "no results" };
  } catch (err) {
    return { ticker, found: false, error: (err as Error).message };
  }
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

  const tickers = allTickers();
  console.log(`Verifying ${tickers.length} unique tickers across all baskets…\n`);

  const results: VerifyResult[] = [];
  for (const t of tickers) {
    const r = await searchTicker(t, {
      "x-api-key": apiKey,
      "x-user-key": userKey,
      "x-request-id": uuid(),
    });
    results.push(r);
    const tag = r.found ? "✓" : "✕";
    const detail = r.found ? `id=${r.instrumentId}` : (r.error ?? "");
    console.log(`  ${tag}  ${t.padEnd(8)}  ${detail}`);
    await sleep(80);
  }

  const missing = results.filter((r) => !r.found);
  console.log("");
  console.log(`Summary: ${results.length - missing.length}/${results.length} found`);
  if (missing.length > 0) {
    console.log("Missing tickers — replace these in lib/baskets.ts before launching:");
    for (const m of missing) console.log(`  ✕ ${m.ticker} — ${m.error}`);
    process.exit(1);
  }
  console.log("All baskets verified ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
