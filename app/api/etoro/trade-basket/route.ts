import { NextResponse } from "next/server";

/**
 * POST /api/etoro/trade-basket
 * Body: { apiKey, userKey, env: "real"|"demo",
 *         basket: [{ ticker, amount, instrumentId }] }
 *
 * Each holding carries its eToro instrumentId pre-resolved at build time
 * from the public catalog (api.etorostatic.com/sapi/instrumentsmetadata),
 * so we skip the runtime /market-data/search step (which doesn't reliably
 * filter on this endpoint anyway). We just submit a market BUY order per
 * holding for the given amount.
 *
 * Per the etoro-apps skill:
 *  - Trading body uses PascalCase (InstrumentID, IsBuy, Leverage, Amount).
 *  - Demo path: /trading/execution/demo/market-open-orders/by-amount
 *  - Real path: /trading/execution/market-open-orders/by-amount
 */

export const runtime = "edge";
export const dynamic = "force-dynamic";

const BASE = "https://public-api.etoro.com/api/v1";

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface BasketHolding {
  ticker: string;
  amount: number;
  instrumentId?: number;  // pre-resolved from lib/baskets.ts
}

interface TradeResult {
  ticker: string;
  ok: boolean;
  message?: string;
  orderId?: string;
}

async function searchInstrumentId(
  ticker: string,
  headers: Record<string, string>
): Promise<number | null> {
  const url = `${BASE}/market-data/search?internalSymbolFull=${encodeURIComponent(ticker)}&fields=instrumentId,internalSymbolFull`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const json = (await res.json()) as unknown;
  // The response can be an array, or { instruments: [...] } / { items: [...] }
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
      if (typeof id === "number") return id;
    }
  }
  // Fall back to first item if exact match wasn't found
  const first = list[0] as Record<string, unknown> | undefined;
  if (first) {
    const id = (first.instrumentId ?? first.InstrumentID) as number | undefined;
    if (typeof id === "number") return id;
  }
  return null;
}

async function placeOrder(
  instrumentId: number,
  amount: number,
  env: "real" | "demo",
  headers: Record<string, string>
): Promise<{ ok: boolean; message?: string; orderId?: string }> {
  const path =
    env === "demo"
      ? "/trading/execution/demo/market-open-orders/by-amount"
      : "/trading/execution/market-open-orders/by-amount";
  const body = {
    InstrumentID: instrumentId,
    IsBuy: true,
    Leverage: 1,
    Amount: amount,
  };
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    if (!res.ok) {
      const msg =
        parsed && typeof parsed === "object"
          ? ((parsed as Record<string, unknown>).message as string) ||
            ((parsed as Record<string, unknown>).error as string) ||
            `HTTP ${res.status}`
          : `HTTP ${res.status}`;
      return { ok: false, message: msg };
    }
    let orderId: string | undefined;
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      const raw = o.orderId ?? o.OrderID ?? o.id;
      if (raw !== undefined) orderId = String(raw);
    }
    return { ok: true, message: "submitted", orderId };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export async function POST(req: Request) {
  let body: {
    apiKey?: string;
    userKey?: string;
    env?: "real" | "demo";
    basket?: BasketHolding[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiKey = (body.apiKey ?? "").trim();
  const userKey = (body.userKey ?? "").trim();
  const env = body.env === "real" ? "real" : "demo";
  const basket = Array.isArray(body.basket) ? body.basket : [];

  if (!apiKey || !userKey) {
    return NextResponse.json({ error: "Missing eToro keys" }, { status: 400 });
  }
  if (basket.length === 0) {
    return NextResponse.json({ error: "Empty basket" }, { status: 400 });
  }

  const baseHeaders: Record<string, string> = {
    "x-api-key": apiKey,
    "x-user-key": userKey,
  };

  const results: TradeResult[] = [];

  for (const h of basket) {
    const ticker = (h.ticker ?? "").trim().toUpperCase();
    const amount = Number(h.amount);
    if (!ticker || !Number.isFinite(amount) || amount <= 0) {
      results.push({ ticker: ticker || "—", ok: false, message: "invalid input" });
      continue;
    }

    // Resolve instrumentId — prefer pre-baked id from lib/baskets.ts, fall
    // back to a runtime search if for some reason the client didn't send one.
    let instrumentId: number | null = null;
    if (typeof h.instrumentId === "number" && h.instrumentId > 0) {
      instrumentId = h.instrumentId;
    } else {
      instrumentId = await searchInstrumentId(ticker, {
        ...baseHeaders,
        "x-request-id": uuid(),
      });
    }
    if (!instrumentId) {
      results.push({ ticker, ok: false, message: "instrument not found on eToro" });
      continue;
    }

    // Submit market order
    const order = await placeOrder(instrumentId, amount, env, {
      ...baseHeaders,
      "x-request-id": uuid(),
    });
    results.push({ ticker, ...order });
  }

  return NextResponse.json({ results });
}
