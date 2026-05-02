/**
 * Per-phase × per-region ETF baskets.
 *
 * REGION = the economy being hedged against (not the user's regulatory
 * zone). So:
 *   - US baskets hedge US-economy risk with US-correlated assets:
 *     US Treasuries, TIPS, US sector defensives, gold (USD).
 *   - EU baskets hedge eurozone risk with euro-correlated assets:
 *     German Bunds, euro inflation-linked, European sector defensives,
 *     euro money-market, gold (EUR).
 *   - UK baskets hedge UK risk with UK-correlated assets:
 *     UK gilts, UK index-linked gilts (INXG), FTSE-tilted defensives,
 *     gold (GBP).
 *   - Global baskets hedge a global slowdown via the world's safe-haven
 *     complex (USD short Treasuries, USD long Treasuries, gold, hedged
 *     global IG bonds).
 *
 * All picks are mainstream, high-AUM, low-spread funds. Every line
 * carries a rationale that explains what it holds, why this specific
 * fund vs alternatives, and the historical evidence supporting its
 * inclusion at this weight.
 *
 * Nothing in this file is financial advice.
 */

import type { Zone } from "./interpret";
import type { RegionId } from "./types";

export interface BasketHolding {
  ticker: string;
  name: string;
  weight: number;
  shortRationale: string;
  longRationale: string;
}

export interface Basket {
  zone: Zone;
  region: RegionId;
  title: string;
  thesis: string;
  holdings: BasketHolding[];
}

// ============================================================================
// US — hedging US-economy risk with US-correlated assets (USD)
// ============================================================================

const US_CLEAR: Basket = {
  zone: "clear", region: "us",
  title: "Position for US upside",
  thesis: "US indicators benign. Lean into broad US equity and growth, with international diversification and a quality ballast.",
  holdings: [
    { ticker: "VTI", name: "Vanguard Total Stock Market ETF", weight: 40,
      shortRationale: "Foundational US equity (~4,000 stocks, all caps).",
      longRationale: "VTI is the cleanest single-fund US equity proxy — the entire investable US market across all caps. 0.03% ER, ~$400bn AUM. The default US-economy long when conditions favour risk-on." },
    { ticker: "QQQ", name: "Invesco QQQ Trust", weight: 25,
      shortRationale: "Top 100 Nasdaq names — US growth/tech tilt.",
      longRationale: "Captures the high-beta US growth segment that benign macro tends to reward most. 0.20% ER, ~$300bn AUM." },
    { ticker: "VEA", name: "Vanguard FTSE Developed Markets ETF", weight: 15,
      shortRationale: "International developed — diversifies US-only concentration.",
      longRationale: "Lower correlation to US-led drawdowns. Reduces single-economy concentration without giving up risk-on positioning." },
    { ticker: "VWO", name: "Vanguard FTSE Emerging Markets ETF", weight: 10,
      shortRationale: "EM equity — high beta to global growth.",
      longRationale: "Highest beta to global growth backdrop. Sized small to control downside if US conditions deteriorate." },
    { ticker: "SCHD", name: "Schwab US Dividend Equity ETF", weight: 10,
      shortRationale: "Quality US dividend payers as ballast.",
      longRationale: "Quality factor screen — sustainable dividends and balance-sheet strength. Keeps the basket from being purely high-beta." },
  ],
};

const US_WATCH: Basket = {
  zone: "watch", region: "us",
  title: "Lean toward US quality",
  thesis: "Yellow flags in US data. Rotate toward US dividend, quality, and start adding US Treasury ballast.",
  holdings: [
    { ticker: "SCHD", name: "Schwab US Dividend Equity ETF", weight: 30,
      shortRationale: "Quality dividend payers — defensive equity factor.",
      longRationale: "US dividend-payers historically outperform in late-cycle environments — cash flows less reliant on continued growth." },
    { ticker: "VYM", name: "Vanguard High Dividend Yield ETF", weight: 20,
      shortRationale: "Higher-yield US stocks — broader dividend complement.",
      longRationale: "Wider, more value-tilted high-yield US set. Together with SCHD covers the US income-equity factor." },
    { ticker: "VTI", name: "Vanguard Total Stock Market ETF", weight: 20,
      shortRationale: "Broad US core — keeps participation if signals are false alarms.",
      longRationale: "Maintains US equity exposure if the slowdown signals don't pan out." },
    { ticker: "BND", name: "Vanguard Total Bond Market ETF", weight: 15,
      shortRationale: "US investment-grade bonds — late-cycle rates ballast.",
      longRationale: "Begins building US bond exposure as the Fed approaches a cutting cycle. Bond returns typically positive when growth slows." },
    { ticker: "TIP", name: "iShares TIPS Bond ETF", weight: 15,
      shortRationale: "US inflation-linked Treasuries — real-yield protection.",
      longRationale: "TIP holds Treasury Inflation-Protected Securities. Hedges the late-cycle scenario where slowing growth coincides with sticky inflation." },
  ],
};

const US_WARNING: Basket = {
  zone: "warning", region: "us",
  title: "Add US defensive exposure",
  thesis: "Multiple US indicators pointing to slowdown. Rotate into US defensive sectors, Treasuries, TIPS and gold.",
  holdings: [
    { ticker: "XLU", name: "Utilities Select Sector SPDR", weight: 18,
      shortRationale: "US utilities — recession-resistant cash flows.",
      longRationale: "Demand for electricity and water is inelastic. Regulated returns provide bond-like cash-flow stability. Outperformed S&P during 2008 and 2020 drawdowns." },
    { ticker: "XLP", name: "Consumer Staples Select Sector SPDR", weight: 18,
      shortRationale: "US staples — necessities-driven demand.",
      longRationale: "Procter & Gamble, Coca-Cola, PepsiCo, Walmart — pricing power and inelastic demand make staples a reliable defensive sector." },
    { ticker: "XLV", name: "Health Care Select Sector SPDR", weight: 14,
      shortRationale: "US healthcare — defensive demand.",
      longRationale: "UnitedHealth, J&J, Eli Lilly. Healthcare demand is largely inelastic to economic conditions." },
    { ticker: "GLD", name: "SPDR Gold Shares", weight: 18,
      shortRationale: "Gold — historic hedge against US equity stress.",
      longRationale: "Largest physical-gold ETF (~$70bn AUM). Outperforms when equities fall and the Fed eases." },
    { ticker: "IEF", name: "iShares 7-10 Year Treasury Bond ETF", weight: 12,
      shortRationale: "Intermediate US Treasuries — pure rates exposure.",
      longRationale: "Pure intermediate-duration Treasury play, no credit risk. Direct hedge against US equity drawdown via expected Fed cuts." },
    { ticker: "TIP", name: "iShares TIPS Bond ETF", weight: 10,
      shortRationale: "US inflation-linked Treasuries — stagflation hedge.",
      longRationale: "Real-yield protection — covers the scenario where slowdown coincides with inflation that doesn't fully roll over." },
    { ticker: "BND", name: "Vanguard Total Bond Market ETF", weight: 10,
      shortRationale: "US investment-grade bonds.",
      longRationale: "IG bonds typically rally as recession risk rises — rates fall and quality spreads compress." },
  ],
};

const US_STORM: Basket = {
  zone: "storm", region: "us",
  title: "Preserve capital in a US recession",
  thesis: "US recession signals firing. US Treasuries (cash + long duration), TIPS, and gold.",
  holdings: [
    { ticker: "BIL", name: "SPDR Bloomberg 1-3 Month T-Bill ETF", weight: 28,
      shortRationale: "US T-bills — high-yield cash position.",
      longRationale: "1-3 month US T-Bills. Effectively a high-yield cash position with near-zero duration risk. Safest deployable-cash position in USD." },
    { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", weight: 22,
      shortRationale: "Long US Treasuries — convex play on Fed cuts.",
      longRationale: "When the Fed cuts during recession, long-duration Treasuries rally hardest. ~17yr duration means a few hundred bps of cuts can drive 20%+ returns." },
    { ticker: "TIP", name: "iShares TIPS Bond ETF", weight: 15,
      shortRationale: "US inflation-linked Treasuries — real-yield insurance.",
      longRationale: "Hedges the stagflationary tail — Treasury credit safety with explicit CPI uplift if inflation persists." },
    { ticker: "SHV", name: "iShares Short Treasury Bond ETF", weight: 10,
      shortRationale: "0-1 year US Treasuries — slightly more yield than BIL.",
      longRationale: "Complements BIL with a touch more duration but still effectively cash-like." },
    { ticker: "GLD", name: "SPDR Gold Shares", weight: 20,
      shortRationale: "Gold — outperforms during equity stress and easing.",
      longRationale: "Real rates fall and currency-debasement fears rise during US recessions. The most liquid physical-gold vehicle." },
    { ticker: "XLU", name: "Utilities Select Sector SPDR", weight: 5,
      shortRationale: "US utilities — defensive equity remnant.",
      longRationale: "Small remaining US equity exposure. Most resilient sector in deep drawdowns." },
  ],
};

// ============================================================================
// EU — hedging eurozone risk with euro-correlated assets (EUR)
// ============================================================================

const EU_CLEAR: Basket = {
  zone: "clear", region: "eu",
  title: "Position for eurozone upside",
  thesis: "Eurozone indicators benign. European equity exposure with growth and home tilts.",
  holdings: [
    { ticker: "EXSA", name: "iShares STOXX Europe 600 UCITS ETF", weight: 35,
      shortRationale: "Broad European equity — 600 large/mid caps across the eurozone+.",
      longRationale: "EXSA is the canonical broad-Europe equity vehicle. Captures the full STOXX Europe 600 — the de-facto European equity benchmark. 0.20% TER." },
    { ticker: "DBXD", name: "Xtrackers DAX UCITS ETF", weight: 20,
      shortRationale: "German DAX — Europe's largest economy.",
      longRationale: "Direct exposure to Germany's 40 largest companies. Germany is the eurozone's economic anchor; DAX moves track eurozone growth signals tightly. 0.09% TER." },
    { ticker: "EXSI", name: "iShares STOXX Europe Mid 200 UCITS ETF", weight: 15,
      shortRationale: "European mid-caps — domestic-revenue exposure.",
      longRationale: "European mid-caps derive more revenue from home markets than the large-cap STOXX 600. Higher beta to eurozone growth specifically." },
    { ticker: "VEUR", name: "Vanguard FTSE Developed Europe UCITS ETF", weight: 20,
      shortRationale: "Developed Europe core — quality complement.",
      longRationale: "Vanguard's European core, very low TER (0.10%). Diversified across sectors and major continental economies." },
    { ticker: "EIMI", name: "iShares Core MSCI EM IMI UCITS ETF", weight: 10,
      shortRationale: "Emerging markets — global growth beta.",
      longRationale: "Some EM exposure as a high-beta complement when global conditions are benign. Sized small." },
  ],
};

const EU_WATCH: Basket = {
  zone: "watch", region: "eu",
  title: "Lean toward eurozone quality",
  thesis: "Yellow flags in eurozone. Rotate toward European dividend stocks and start adding euro-bond ballast.",
  holdings: [
    { ticker: "EUDV", name: "SPDR S&P Euro Dividend Aristocrats UCITS ETF", weight: 28,
      shortRationale: "Euro dividend aristocrats — quality income factor.",
      longRationale: "Holds eurozone companies with sustainable, growing dividends. The European equivalent of SCHD's quality-screen approach." },
    { ticker: "EXSA", name: "iShares STOXX Europe 600 UCITS ETF", weight: 22,
      shortRationale: "Broad European core — keeps participation.",
      longRationale: "Maintains broad European equity exposure if signals turn out to be false alarms." },
    { ticker: "DBXD", name: "Xtrackers DAX UCITS ETF", weight: 15,
      shortRationale: "German DAX — eurozone anchor.",
      longRationale: "Germany is the eurozone economic engine. Direct DAX exposure tracks eurozone fortunes most tightly." },
    { ticker: "EUNA", name: "iShares Core € Corp Bond UCITS ETF", weight: 20,
      shortRationale: "EUR investment-grade corporate bonds — late-cycle ballast.",
      longRationale: "EUR-denominated IG corporates. Begins building euro fixed-income as the ECB approaches an easing cycle. 0.20% TER." },
    { ticker: "IBCI", name: "iShares € Inflation Linked Govt Bond UCITS ETF", weight: 15,
      shortRationale: "Euro inflation-linked govt bonds — real-yield protection.",
      longRationale: "Euro-area inflation-linked sovereign bonds (mostly French OATi, Italian BTPi, German Bund-i). The euro equivalent of TIP for hedging stagflation." },
  ],
};

const EU_WARNING: Basket = {
  zone: "warning", region: "eu",
  title: "Add eurozone defensive exposure",
  thesis: "Multiple eurozone indicators pointing to slowdown. European defensives, gold, Bunds, inflation-linked.",
  holdings: [
    { ticker: "EXH9", name: "iShares STOXX Europe 600 Health Care UCITS ETF", weight: 18,
      shortRationale: "European healthcare — defensive sector with inelastic demand.",
      longRationale: "Novo Nordisk, Roche, AstraZeneca, Sanofi. European healthcare giants with global revenue and inelastic demand." },
    { ticker: "EXH4", name: "iShares STOXX Europe 600 Utilities UCITS ETF", weight: 14,
      shortRationale: "European utilities — recession-resistant cash flows.",
      longRationale: "Iberdrola, Enel, RWE, National Grid. Regulated returns provide bond-like stability through downturns." },
    { ticker: "EXH3", name: "iShares STOXX Europe 600 Personal & Household Goods UCITS ETF", weight: 13,
      shortRationale: "European staples — necessities-driven demand.",
      longRationale: "Nestlé, L'Oréal, Unilever, Reckitt. Pricing power and inelastic demand — the European staples factor." },
    { ticker: "SGLN", name: "iShares Physical Gold ETC", weight: 18,
      shortRationale: "Gold — historic hedge against equity stress (EUR-tradeable).",
      longRationale: "Largest UCITS physical-gold vehicle. Outperforms when equities fall and central banks ease." },
    { ticker: "EUNH", name: "iShares Euro Govt Bond Capped 5.5-10.5yr UCITS ETF", weight: 15,
      shortRationale: "Eurozone govt bonds (Bunds + OATs + BTPs) — rates ballast.",
      longRationale: "Pure euro-area sovereign exposure across the major issuers. Rallies when the ECB approaches cuts." },
    { ticker: "IBCI", name: "iShares € Inflation Linked Govt Bond UCITS ETF", weight: 12,
      shortRationale: "Euro inflation-linked — stagflation hedge.",
      longRationale: "Real-yield protection on euro-area sovereigns. Covers the scenario where eurozone slowdown coincides with sticky inflation." },
    { ticker: "EUNA", name: "iShares Core € Corp Bond UCITS ETF", weight: 10,
      shortRationale: "EUR investment-grade corporates.",
      longRationale: "Investment-grade corporates rally as recession risk rises and credit spreads compress on quality." },
  ],
};

const EU_STORM: Basket = {
  zone: "storm", region: "eu",
  title: "Preserve capital in a eurozone recession",
  thesis: "Recession signals firing in eurozone. Euro money-market, long Bunds (rate-cut convexity), euro inflation-linked, gold.",
  holdings: [
    { ticker: "ERNE", name: "iShares € Ultrashort Bond UCITS ETF", weight: 25,
      shortRationale: "Euro ultrashort IG bonds — EUR cash equivalent.",
      longRationale: "Holds 0-1yr euro-denominated investment-grade bonds. The euro equivalent of BIL — high-yield EUR cash position with near-zero duration risk." },
    { ticker: "EUNH", name: "iShares Euro Govt Bond Capped 5.5-10.5yr UCITS ETF", weight: 15,
      shortRationale: "Mid-duration euro govt bonds — direct ECB-cut beneficiary.",
      longRationale: "Direct exposure to the eurozone sovereign curve at the belly. Rallies most predictably when the ECB starts cutting." },
    { ticker: "DBXG", name: "Xtrackers Eurozone Government Bond 25+ UCITS ETF", weight: 15,
      shortRationale: "Long eurozone govt bonds — convex play on ECB cuts.",
      longRationale: "Long-duration eurozone sovereign exposure (~20yr+ duration). The euro equivalent of TLT — convex bet on ECB rate cuts." },
    { ticker: "IBCI", name: "iShares € Inflation Linked Govt Bond UCITS ETF", weight: 15,
      shortRationale: "Euro inflation-linked — real-yield insurance.",
      longRationale: "Sovereign credit safety with explicit CPI uplift. Hedges the stagflationary tail in eurozone." },
    { ticker: "SGLN", name: "iShares Physical Gold ETC", weight: 20,
      shortRationale: "Gold — outperforms during equity stress and easing.",
      longRationale: "Real rates fall and currency-debasement fears rise during recessions. Largest UCITS gold vehicle." },
    { ticker: "EXH4", name: "iShares STOXX Europe 600 Utilities UCITS ETF", weight: 10,
      shortRationale: "European utilities — defensive equity remnant.",
      longRationale: "Small remaining European equity exposure. Utilities are the most resilient European sector in deep drawdowns." },
  ],
};

// ============================================================================
// UK — hedging UK risk with UK-correlated assets (GBP)
// ============================================================================

const UK_CLEAR: Basket = {
  zone: "clear", region: "uk",
  title: "Position for UK upside",
  thesis: "UK indicators benign. UK equity with FTSE 100 and 250 exposures plus international diversification.",
  holdings: [
    { ticker: "VUKE", name: "Vanguard FTSE 100 UCITS ETF", weight: 25,
      shortRationale: "FTSE 100 — UK large-caps with global revenue.",
      longRationale: "100 largest UK-listed companies. Heavy on energy, financials, miners, pharma — value-tilted vs US tech-heavy indices. Most tracks UK-listed but global-revenue companies. 0.09% TER." },
    { ticker: "VMID", name: "Vanguard FTSE 250 UCITS ETF", weight: 25,
      shortRationale: "FTSE 250 — UK mid-caps, more domestic exposure.",
      longRationale: "FTSE 250 derives ~50%+ revenue from UK economy vs ~25% for FTSE 100. Higher beta to UK growth specifically — the cleanest pure-play UK economic exposure." },
    { ticker: "VUSA", name: "Vanguard S&P 500 UCITS ETF", weight: 20,
      shortRationale: "US large-cap diversification.",
      longRationale: "International diversification away from UK-only concentration. The US market is too large to ignore in any global allocation." },
    { ticker: "VEUR", name: "Vanguard FTSE Developed Europe UCITS ETF", weight: 15,
      shortRationale: "Developed Europe — geographic diversification.",
      longRationale: "European developed-market exposure complements UK home tilt. Captures continental cyclical recovery." },
    { ticker: "EIMI", name: "iShares Core MSCI EM IMI UCITS ETF", weight: 15,
      shortRationale: "Emerging markets — high beta to global growth.",
      longRationale: "EM equity for benign global conditions. Diversifies away from the UK's heavily-financialised equity composition." },
  ],
};

const UK_WATCH: Basket = {
  zone: "watch", region: "uk",
  title: "Lean toward UK quality",
  thesis: "Yellow flags in UK. Rotate toward FTSE 100 (defensive sector mix), and start adding gilt and inflation-linked ballast.",
  holdings: [
    { ticker: "VUKE", name: "Vanguard FTSE 100 UCITS ETF", weight: 30,
      shortRationale: "FTSE 100 — defensive sector mix.",
      longRationale: "FTSE 100 is heavy on staples (Unilever, Diageo), pharma (AstraZeneca, GSK), utilities (National Grid) — sectors that hold up better than mid-caps in slowdowns." },
    { ticker: "VHYG", name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF (GBP)", weight: 20,
      shortRationale: "Global dividend complement, GBP-priced.",
      longRationale: "Global dividend aristocrats hedge UK-only concentration. Dividend-payers historically outperform in late-cycle environments." },
    { ticker: "VMID", name: "Vanguard FTSE 250 UCITS ETF", weight: 15,
      shortRationale: "FTSE 250 — keeps domestic-economy participation.",
      longRationale: "Maintains domestic UK exposure. Reduce vs Clear basket but keep meaningful position if UK signals turn out to be false alarms." },
    { ticker: "IGLT", name: "iShares Core UK Gilts UCITS ETF", weight: 20,
      shortRationale: "UK gilts — home-currency rates ballast.",
      longRationale: "Direct UK government bond exposure in GBP. Begins adding gilt exposure as the BoE approaches an easing cycle. 0.07% TER." },
    { ticker: "INXG", name: "iShares £ Index-Linked Gilts UCITS ETF", weight: 15,
      shortRationale: "UK index-linked gilts — UK TIPS equivalent.",
      longRationale: "UK government inflation-linked bonds (linkers). Real-yield protection for the late-cycle scenario where UK growth slows but inflation stays sticky. Critical hedge for UK households facing dual stress." },
  ],
};

const UK_WARNING: Basket = {
  zone: "warning", region: "uk",
  title: "Add UK defensive exposure",
  thesis: "Multiple UK indicators pointing to slowdown. UK-correlated defensives, gilts, index-linked gilts, gold.",
  holdings: [
    { ticker: "VUKE", name: "Vanguard FTSE 100 UCITS ETF", weight: 18,
      shortRationale: "FTSE 100 — defensive UK large-caps.",
      longRationale: "FTSE 100's dominant defensive sector mix (staples, pharma, utilities) makes it the most resilient UK equity vehicle in a domestic slowdown." },
    { ticker: "EXH9", name: "iShares STOXX Europe 600 Health Care UCITS ETF", weight: 12,
      shortRationale: "Healthcare — UK pharma giants AZN/GSK plus continental peers.",
      longRationale: "Heavy UK weight via AstraZeneca and GSK plus continental defensive healthcare. Inelastic demand sector." },
    { ticker: "EXH4", name: "iShares STOXX Europe 600 Utilities UCITS ETF", weight: 10,
      shortRationale: "Utilities — incl. UK names like National Grid.",
      longRationale: "European utilities including UK names. Regulated cash flows are recession-resistant." },
    { ticker: "SGLN", name: "iShares Physical Gold ETC", weight: 18,
      shortRationale: "Gold — historic hedge, GBP-tradeable.",
      longRationale: "Largest UCITS physical-gold vehicle, LSE-listed. Outperforms when equities fall and central banks ease." },
    { ticker: "IGLT", name: "iShares Core UK Gilts UCITS ETF", weight: 18,
      shortRationale: "UK gilts — pure GBP-rates exposure.",
      longRationale: "UK government bonds. Direct hedge against UK equity drawdown via expected BoE cuts." },
    { ticker: "INXG", name: "iShares £ Index-Linked Gilts UCITS ETF", weight: 14,
      shortRationale: "UK index-linked gilts — sovereign + inflation hedge.",
      longRationale: "UK linkers: Treasury credit safety with explicit RPI uplift. Critical for the UK's sticky-inflation-plus-slowdown scenario." },
    { ticker: "ERNS", name: "iShares £ Ultrashort Bond UCITS ETF", weight: 10,
      shortRationale: "GBP ultrashort bonds — start adding cash equivalent.",
      longRationale: "0-1yr GBP-denominated IG bonds. Begins building GBP cash buffer as the cycle ages." },
  ],
};

const UK_STORM: Basket = {
  zone: "storm", region: "uk",
  title: "Preserve capital in a UK recession",
  thesis: "UK recession signals firing. Short gilts (cash), long gilts (rate-cut convexity), index-linked gilts (inflation), gold.",
  holdings: [
    { ticker: "ERNS", name: "iShares £ Ultrashort Bond UCITS ETF", weight: 28,
      shortRationale: "GBP ultrashort bonds — high-yield GBP cash position.",
      longRationale: "0-1yr GBP-denominated IG bonds. The GBP equivalent of BIL — high-yield cash position with near-zero duration risk for UK investors." },
    { ticker: "IGLT", name: "iShares Core UK Gilts UCITS ETF", weight: 22,
      shortRationale: "UK gilts — direct BoE-cut beneficiary.",
      longRationale: "Pure UK government bond exposure. The home-currency rates play that rallies most predictably when the BoE starts cutting." },
    { ticker: "INXG", name: "iShares £ Index-Linked Gilts UCITS ETF", weight: 17,
      shortRationale: "UK index-linked gilts — UK TIPS equivalent.",
      longRationale: "Real-yield insurance specific to UK inflation. The most important UK-specific hedge — the UK has a structural inflation problem and linker demand spikes in stagflationary scenarios." },
    { ticker: "SGLN", name: "iShares Physical Gold ETC", weight: 23,
      shortRationale: "Gold — outperforms during equity stress and easing.",
      longRationale: "Real rates fall and currency-debasement fears rise during UK recessions. The largest UCITS physical-gold vehicle, GBP-traded on LSE." },
    { ticker: "EXH4", name: "iShares STOXX Europe 600 Utilities UCITS ETF", weight: 10,
      shortRationale: "Utilities — defensive equity remnant including UK names.",
      longRationale: "Small remaining defensive equity exposure. Includes UK utilities like National Grid plus continental peers." },
  ],
};

// ============================================================================
// Global — hedging a global slowdown via the world's safe-haven complex
// ============================================================================

const GLOBAL_CLEAR: Basket = {
  zone: "clear", region: "global",
  title: "Position for global upside",
  thesis: "Global indicators benign. World-equity tracker with growth, EM, and Europe tilts.",
  holdings: [
    { ticker: "VWRA", name: "Vanguard FTSE All-World UCITS ETF (USD, Acc)", weight: 50,
      shortRationale: "Global equity in one ticker — accumulating share class.",
      longRationale: "VWRA is the cleanest one-fund global equity core. ~3,700 stocks across DM and EM, ~90% of investable global equity. 0.22% TER." },
    { ticker: "EQQQ", name: "Invesco EQQQ Nasdaq-100 UCITS ETF", weight: 20,
      shortRationale: "Nasdaq-100 — global growth tilt.",
      longRationale: "Adds tech/growth tilt on top of the world-equity base. The Nasdaq-100 has been the dominant global growth driver of the past decade." },
    { ticker: "EIMI", name: "iShares Core MSCI EM IMI UCITS ETF", weight: 15,
      shortRationale: "EM overweight — extra growth-beta.",
      longRationale: "Brings EM weighting above the ~10% included in VWRA. High-beta exposure when global conditions are clearly benign." },
    { ticker: "VEUR", name: "Vanguard FTSE Developed Europe UCITS ETF", weight: 15,
      shortRationale: "Europe overweight — value diversification.",
      longRationale: "Tilts away from US-heavy world indices toward European value. Lower P/Es provide some valuation cushion." },
  ],
};

const GLOBAL_WATCH: Basket = {
  zone: "watch", region: "global",
  title: "Lean toward global quality",
  thesis: "Some global indicators flashing yellow. Quality and dividend tilts with global bond ballast.",
  holdings: [
    { ticker: "VHYL", name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF", weight: 30,
      shortRationale: "Global high-dividend factor.",
      longRationale: "~1,800 high-yield stocks worldwide. Defensive equity factor that historically outperforms in late-cycle environments." },
    { ticker: "VWRA", name: "Vanguard FTSE All-World UCITS ETF (USD, Acc)", weight: 25,
      shortRationale: "Broad global equity core.",
      longRationale: "Maintains diversified global exposure if signals are false alarms." },
    { ticker: "AGGH", name: "iShares Core Global Aggregate Bond UCITS ETF (Hedged)", weight: 20,
      shortRationale: "Currency-hedged global IG bond ballast.",
      longRationale: "AGGH covers the global IG bond market in a currency-hedged UCITS wrapper. Removes FX noise from the bond ballast." },
    { ticker: "VEUR", name: "Vanguard FTSE Developed Europe UCITS ETF", weight: 15,
      shortRationale: "European value tilt.",
      longRationale: "Lower-P/E European exposure as a defensive tilt within equities." },
    { ticker: "SGLN", name: "iShares Physical Gold ETC", weight: 10,
      shortRationale: "Early defensive gold position.",
      longRationale: "Gold tends to outperform when central banks shift dovish. Small starter position." },
  ],
};

const GLOBAL_WARNING: Basket = {
  zone: "warning", region: "global",
  title: "Add global defensive exposure",
  thesis: "Multiple global indicators pointing to slowdown. Defensives across regions, gold, hedged bonds, US Treasuries.",
  holdings: [
    { ticker: "EXH9", name: "iShares STOXX Europe 600 Health Care UCITS ETF", weight: 18,
      shortRationale: "Defensive healthcare with global revenue.",
      longRationale: "European healthcare giants with global revenue streams — defensive earnings with international diversification." },
    { ticker: "EXH4", name: "iShares STOXX Europe 600 Utilities UCITS ETF", weight: 12,
      shortRationale: "Utilities — recession-resistant cash flows.",
      longRationale: "Utility demand is inelastic to economic conditions. Bond-like cash-flow stability." },
    { ticker: "SGLN", name: "iShares Physical Gold ETC", weight: 20,
      shortRationale: "Gold — historic hedge against equity stress.",
      longRationale: "The most liquid UCITS gold vehicle. Outperforms when equities fall and central banks ease." },
    { ticker: "AGGH", name: "iShares Core Global Aggregate Bond UCITS ETF (Hedged)", weight: 15,
      shortRationale: "Currency-hedged global IG bonds.",
      longRationale: "IG bonds typically rally as recession risk rises. Currency-hedged removes FX noise from the bond ballast." },
    { ticker: "IDTL", name: "iShares $ Treasury Bond 20+yr UCITS ETF", weight: 20,
      shortRationale: "Long US Treasuries — global safe-haven duration.",
      longRationale: "USD long bonds are the world's safe-haven duration complex during global stress. Convex hedge against equity drawdown." },
    { ticker: "EIMB", name: "iShares J.P. Morgan $ EM Bond UCITS ETF", weight: 15,
      shortRationale: "USD EM sovereign bonds — yield with diversification.",
      longRationale: "USD-denominated emerging-market sovereign bonds add yield without single-country credit risk." },
  ],
};

const GLOBAL_STORM: Basket = {
  zone: "storm", region: "global",
  title: "Preserve capital in a global recession",
  thesis: "Recession signals firing globally. USD T-bills, long Treasuries, gold, hedged global bonds.",
  holdings: [
    { ticker: "IB01", name: "iShares $ Treasury Bond 0-1yr UCITS ETF", weight: 30,
      shortRationale: "USD T-bills — high-yield cash position.",
      longRationale: "0-1yr US Treasury Bills in UCITS form. The world's safest deployable-cash position. Near-zero duration risk." },
    { ticker: "IDTL", name: "iShares $ Treasury Bond 20+yr UCITS ETF", weight: 25,
      shortRationale: "Long US Treasuries — convex play on Fed cuts.",
      longRationale: "When the Fed cuts during global recession, long Treasuries rally hardest. The world's preferred convex duration trade." },
    { ticker: "SGLN", name: "iShares Physical Gold ETC", weight: 25,
      shortRationale: "Gold — performs during equity stress and easing cycles.",
      longRationale: "Real rates fall and currency-debasement fears rise during global recessions. The most liquid UCITS gold vehicle." },
    { ticker: "AGGH", name: "iShares Core Global Aggregate Bond UCITS ETF (Hedged)", weight: 10,
      shortRationale: "Currency-hedged global IG bonds.",
      longRationale: "Diversifies the heavy USD tilt with hedged global IG bond exposure. Investment-grade only, so credit risk minimised." },
    { ticker: "EXH4", name: "iShares STOXX Europe 600 Utilities UCITS ETF", weight: 10,
      shortRationale: "Utilities — defensive equity remnant.",
      longRationale: "Small remaining defensive equity exposure. The most resilient sector in deep drawdowns." },
  ],
};

// ============================================================================

const BASKETS: Record<RegionId, Record<Zone, Basket>> = {
  us: { clear: US_CLEAR, watch: US_WATCH, warning: US_WARNING, storm: US_STORM },
  eu: { clear: EU_CLEAR, watch: EU_WATCH, warning: EU_WARNING, storm: EU_STORM },
  uk: { clear: UK_CLEAR, watch: UK_WATCH, warning: UK_WARNING, storm: UK_STORM },
  global: { clear: GLOBAL_CLEAR, watch: GLOBAL_WATCH, warning: GLOBAL_WARNING, storm: GLOBAL_STORM },
};

export function basketFor(zone: Zone, region: RegionId = "us"): Basket {
  return BASKETS[region][zone];
}

export function allocate(
  basket: Basket,
  amount: number
): Array<BasketHolding & { dollars: number }> {
  return basket.holdings.map((h) => ({
    ...h,
    dollars: Math.round((h.weight / 100) * amount * 100) / 100,
  }));
}


/** Internal: every basket — used only by scripts/verify-baskets.ts. */
export const BASKETS_FOR_VERIFY = BASKETS;

/** Returns every unique ticker across all baskets, sorted. */
export function allTickers(): string[] {
  const set = new Set<string>();
  for (const region of Object.values(BASKETS)) {
    for (const basket of Object.values(region)) {
      for (const h of basket.holdings) set.add(h.ticker);
    }
  }
  return Array.from(set).sort();
}
