/**
 * Per-phase ETF baskets.
 *
 * Picks are mainstream, highly liquid US-listed ETFs available on eToro.
 * Every ticker has a documented thematic role; the rationale is surfaced in
 * the trade modal so the user sees WHY each line is in the basket — not just
 * what.
 *
 * Selection principles:
 *  - High AUM, tight spreads (no obscure niche funds)
 *  - One-job-each: no two ETFs in a basket should overlap heavily
 *  - Defensible against compliance scrutiny — no leveraged/inverse
 *    products, no single-stock proxies
 *
 * Weights sum to 100 per basket.
 */

import type { Zone } from "./interpret";

export interface BasketHolding {
  ticker: string;
  name: string;
  weight: number;          // 0–100, integer
  shortRationale: string;  // one-line, shown inline
  longRationale: string;   // shown on hover / Pro mode
}

export interface Basket {
  zone: Zone;
  title: string;           // headline shown above the breakdown
  thesis: string;          // one-sentence positioning thesis
  holdings: BasketHolding[];
}

const CLEAR: Basket = {
  zone: "clear",
  title: "Position for the upside",
  thesis:
    "Indicators are benign. Lean into broad-equity and growth exposure with a small quality ballast.",
  holdings: [
    {
      ticker: "VTI",
      name: "Vanguard Total Stock Market ETF",
      weight: 40,
      shortRationale: "Foundational US equity exposure (4,000+ stocks).",
      longRationale:
        "VTI is the cleanest single-fund US equity proxy — it holds essentially the entire investable US market across all market caps. Expense ratio 0.03%. Anchors the basket when conditions favour broad risk-on positioning.",
    },
    {
      ticker: "QQQ",
      name: "Invesco QQQ Trust",
      weight: 25,
      shortRationale: "Top 100 Nasdaq names — tech/growth tilt.",
      longRationale:
        "QQQ captures the high-beta upside that growth-friendly environments tend to reward. In benign macro conditions, technology and large-cap growth historically outperform; this is the basket's offensive line.",
    },
    {
      ticker: "VEA",
      name: "Vanguard FTSE Developed Markets ETF",
      weight: 15,
      shortRationale: "International developed (Europe, Japan, Asia ex-EM).",
      longRationale:
        "Diversifies away from US-only concentration. Developed-markets equities have lower correlation to a US-led equity drawdown and capture European and Japanese cyclical recoveries.",
    },
    {
      ticker: "VWO",
      name: "Vanguard FTSE Emerging Markets ETF",
      weight: 10,
      shortRationale: "Emerging markets — highest beta to global growth.",
      longRationale:
        "EM equity has the highest beta to global growth — it's the sharpest reward when conditions stay benign and the sharpest pain if they don't. Sized small (10%) to control that risk.",
    },
    {
      ticker: "SCHD",
      name: "Schwab US Dividend Equity ETF",
      weight: 10,
      shortRationale: "Quality dividend payers as ballast.",
      longRationale:
        "Quality and dividend tilt — small ballast to keep the basket from being purely high-beta. SCHD screens for companies with sustainable dividend growth and strong fundamentals.",
    },
  ],
};

const WATCH: Basket = {
  zone: "watch",
  title: "Lean toward quality",
  thesis:
    "Some indicators flashing yellow. Stay invested but rotate toward dividend, quality, and a small bond ballast.",
  holdings: [
    {
      ticker: "SCHD",
      name: "Schwab US Dividend Equity ETF",
      weight: 30,
      shortRationale: "Quality dividend payers — defensive equity factor.",
      longRationale:
        "Dividend-payers historically outperform in late-cycle environments because their cash flows are less reliant on continued growth. SCHD's screen prioritises sustainable dividend growth and balance-sheet quality.",
    },
    {
      ticker: "VYM",
      name: "Vanguard High Dividend Yield ETF",
      weight: 20,
      shortRationale: "Higher-yield US stocks — broader dividend complement.",
      longRationale:
        "Complements SCHD with a wider, more value-tilted set of high-yield US names. Together they give comprehensive coverage of the income-equity factor.",
    },
    {
      ticker: "VTI",
      name: "Vanguard Total Stock Market ETF",
      weight: 20,
      shortRationale: "Broad market core — keeps participation in upside.",
      longRationale:
        "We're not exiting equity, just rotating its mix. VTI keeps a meaningful core position so the basket still participates if the slowdown signals turn out to be false alarms.",
    },
    {
      ticker: "IEFA",
      name: "iShares Core MSCI EAFE ETF",
      weight: 15,
      shortRationale: "International developed — lower US-recession correlation.",
      longRationale:
        "International developed equities historically have lower correlation to US-led drawdowns. IEFA covers Europe, Australasia and the Far East — a meaningful diversifier when US data softens.",
    },
    {
      ticker: "BND",
      name: "Vanguard Total Bond Market ETF",
      weight: 15,
      shortRationale: "Investment-grade bond ballast as growth slows.",
      longRationale:
        "Begins building fixed-income exposure as the cycle ages. Bond returns are typically positive when growth slows because policy rates fall, lifting bond prices.",
    },
  ],
};

const WARNING: Basket = {
  zone: "warning",
  title: "Add defensive exposure",
  thesis:
    "Multiple indicators pointing to slowdown. Rotate into traditional defensives, gold, and bonds.",
  holdings: [
    {
      ticker: "XLU",
      name: "Utilities Select Sector SPDR",
      weight: 20,
      shortRationale: "Regulated utilities — recession-resistant cash flows.",
      longRationale:
        "Utilities are the canonical defensive sector. Demand for electricity and water is inelastic to economic conditions, and utilities' regulated returns provide bond-like cash-flow stability.",
    },
    {
      ticker: "XLP",
      name: "Consumer Staples Select Sector SPDR",
      weight: 20,
      shortRationale: "Necessities — people still buy toothpaste in recessions.",
      longRationale:
        "Consumer staples (food, beverages, household products) have inelastic demand. XLP holds dominant brands like Procter & Gamble, Coca-Cola and PepsiCo — businesses with pricing power that hold up in downturns.",
    },
    {
      ticker: "XLV",
      name: "Health Care Select Sector SPDR",
      weight: 15,
      shortRationale: "Pharma/healthcare — defensive demand.",
      longRationale:
        "Healthcare demand is largely inelastic — people still need prescriptions and care during downturns. XLV captures the megacap pharmaceutical and healthcare-services complex.",
    },
    {
      ticker: "GLD",
      name: "SPDR Gold Shares",
      weight: 20,
      shortRationale: "Gold — historic hedge against equity stress.",
      longRationale:
        "Gold tends to outperform when equities fall and central banks ease. GLD is the largest physical-gold-backed ETF and the most liquid way to add gold exposure without storage hassle.",
    },
    {
      ticker: "BND",
      name: "Vanguard Total Bond Market ETF",
      weight: 15,
      shortRationale: "Diversified investment-grade bonds.",
      longRationale:
        "Investment-grade bonds typically rally as recession risk rises — both because rates fall and because credit spreads compress on quality issuers. BND covers the broad US IG market.",
    },
    {
      ticker: "IEF",
      name: "iShares 7-10 Year Treasury Bond ETF",
      weight: 10,
      shortRationale: "Intermediate Treasuries — pure rates exposure.",
      longRationale:
        "IEF is a pure intermediate-duration Treasury play with no credit risk. Acts as a direct hedge against the equity drawdown risk that the composite is flagging.",
    },
  ],
};

const STORM: Basket = {
  zone: "storm",
  title: "Preserve capital",
  thesis:
    "Recession signals firing. Move toward cash equivalents, long Treasuries (rate-cut convexity), and gold.",
  holdings: [
    {
      ticker: "BIL",
      name: "SPDR Bloomberg 1-3 Month T-Bill ETF",
      weight: 30,
      shortRationale: "Cash equivalent — earns yield with near-zero duration risk.",
      longRationale:
        "BIL holds 1-3 month US Treasury Bills — effectively a high-yield cash position. Near-zero duration means almost no price risk, while still earning the prevailing T-bill rate. The safest possible deployable-cash position.",
    },
    {
      ticker: "SHV",
      name: "iShares Short Treasury Bond ETF",
      weight: 20,
      shortRationale: "0-1 year Treasuries — slightly more yield, still near cash.",
      longRationale:
        "Complements BIL with a slightly longer maturity (up to ~1 year). Adds a bit more yield while keeping duration risk minimal.",
    },
    {
      ticker: "TLT",
      name: "iShares 20+ Year Treasury Bond ETF",
      weight: 20,
      shortRationale: "Long Treasuries — convex play on rate cuts.",
      longRationale:
        "When the Fed cuts during recession, long-duration Treasuries rally hardest. TLT is the primary vehicle for this convex bet — high duration means a few hundred basis points of cuts can drive 20%+ returns.",
    },
    {
      ticker: "GLD",
      name: "SPDR Gold Shares",
      weight: 20,
      shortRationale: "Gold — performs well during equity stress and easing cycles.",
      longRationale:
        "Gold typically appreciates during recessions because real rates fall and currency-debasement fears rise. GLD remains the most liquid way to hold physical-backed gold exposure.",
    },
    {
      ticker: "VNQ",
      name: "Vanguard Real Estate ETF",
      weight: 5,
      shortRationale: "REITs — small contrarian play on rate-cut beneficiaries.",
      longRationale:
        "Small contrarian position. REITs typically sell off going INTO recession (sensitive to growth) but rally hard once rate cuts arrive. Sized at 5% as an early-recovery option.",
    },
    {
      ticker: "XLU",
      name: "Utilities Select Sector SPDR",
      weight: 5,
      shortRationale: "Utilities — defensive equity remnant.",
      longRationale:
        "Small remaining defensive equity exposure. Utilities' bond-like cash flows make them the most resilient equity sector in deep drawdowns.",
    },
  ],
};

export const BASKETS: Record<Zone, Basket> = {
  clear: CLEAR,
  watch: WATCH,
  warning: WARNING,
  storm: STORM,
};

export function basketFor(zone: Zone): Basket {
  return BASKETS[zone];
}

/** Compute dollar allocation per holding given a total amount. */
export function allocate(
  basket: Basket,
  amount: number
): Array<BasketHolding & { dollars: number }> {
  return basket.holdings.map((h) => ({
    ...h,
    dollars: Math.round((h.weight / 100) * amount * 100) / 100,
  }));
}
