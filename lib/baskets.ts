/**
 * Per-phase × per-region ETF baskets.
 *
 * Every ticker in this file has been verified against eToro's public
 * instrument catalog (api.etorostatic.com/sapi/instrumentsmetadata/V1.1/
 * instruments) and the matched instrumentId is stored alongside the
 * ticker so the trade flow can skip the /market-data/search step.
 *
 * Region = the economy being hedged (not the user's regulatory zone):
 *   - US baskets hedge US-economy risk with US-listed ETFs (USD).
 *   - EU baskets hedge eurozone risk with euro-correlated UCITS (EUR).
 *   - UK baskets hedge UK risk with UK-correlated UCITS (GBP).
 *   - Global baskets hedge global slowdown via the world's safe-haven
 *     complex (USD T-bills, USD long Treasuries UCITS, gold, hedged
 *     global IG bonds).
 *
 * Where the perfect candidate isn't on eToro (e.g. UK index-linked
 * gilts INXG, long Bunds 25+ DBXG), we fall back to the nearest
 * tradeable equivalent and note the substitution in the rationale.
 *
 * Nothing in this file is financial advice.
 */

import type { Zone } from "./interpret";
import type { RegionId } from "./types";

export interface BasketHolding {
  ticker: string;            // display ticker (without exchange suffix)
  symbolFull: string;        // eToro internalSymbolFull (e.g. "VTI", "ISF.L")
  instrumentId: number;      // eToro InstrumentID — primary key for trade calls
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
// US — hedging US-economy risk with US-listed ETFs (USD)
// ============================================================================

const US_CLEAR: Basket = {
  zone: "clear", region: "us",
  title: "Position for US upside",
  thesis: "US indicators benign. Lean into broad US equity and growth, with international diversification and a quality ballast.",
  holdings: [
    { ticker: "VTI", symbolFull: "VTI", instrumentId: 4237, name: "Vanguard Total Stock Market ETF", weight: 40,
      shortRationale: "Foundational US equity (~4,000 stocks, all caps).",
      longRationale: "VTI is the cleanest single-fund US equity proxy — the entire investable US market across all caps. 0.03% ER, ~$400bn AUM. The default US-economy long when conditions favour risk-on." },
    { ticker: "QQQ", symbolFull: "QQQ", instrumentId: 3006, name: "Invesco QQQ Trust", weight: 25,
      shortRationale: "Top 100 Nasdaq names — US growth/tech tilt.",
      longRationale: "Captures the high-beta US growth segment that benign macro tends to reward most. 0.20% ER, ~$300bn AUM." },
    { ticker: "VEA", symbolFull: "VEA", instrumentId: 4248, name: "Vanguard FTSE Developed Markets ETF", weight: 15,
      shortRationale: "International developed — diversifies US-only concentration.",
      longRationale: "Lower correlation to US-led drawdowns. Reduces single-economy concentration without giving up risk-on positioning." },
    { ticker: "VWO", symbolFull: "VWO", instrumentId: 4252, name: "Vanguard FTSE Emerging Markets ETF", weight: 10,
      shortRationale: "EM equity — high beta to global growth.",
      longRationale: "Highest beta to global growth backdrop. Sized small to control downside if US conditions deteriorate." },
    { ticker: "SCHD", symbolFull: "SCHD", instrumentId: 3217, name: "Schwab US Dividend Equity ETF", weight: 10,
      shortRationale: "Quality US dividend payers as ballast.",
      longRationale: "Quality factor screen — sustainable dividends and balance-sheet strength. Keeps the basket from being purely high-beta." },
  ],
};

const US_WATCH: Basket = {
  zone: "watch", region: "us",
  title: "Lean toward US quality",
  thesis: "Yellow flags in US data. Rotate toward US dividend, quality, and start adding US Treasury ballast.",
  holdings: [
    { ticker: "SCHD", symbolFull: "SCHD", instrumentId: 3217, name: "Schwab US Dividend Equity ETF", weight: 30,
      shortRationale: "Quality dividend payers — defensive equity factor.",
      longRationale: "US dividend-payers historically outperform in late-cycle environments — cash flows less reliant on continued growth." },
    { ticker: "DGRO", symbolFull: "DGRO", instrumentId: 3149, name: "iShares Core Dividend Growth ETF", weight: 20,
      shortRationale: "Dividend-growth screen — complementary to SCHD.",
      longRationale: "Screens for companies with at least 5yrs of consecutive dividend growth. Substituted for VYM (which isn't on eToro). Less yield, more dividend-growth quality." },
    { ticker: "VTI", symbolFull: "VTI", instrumentId: 4237, name: "Vanguard Total Stock Market ETF", weight: 20,
      shortRationale: "Broad US core — keeps participation if signals are false alarms.",
      longRationale: "Maintains US equity exposure if the slowdown signals don't pan out." },
    { ticker: "BND", symbolFull: "BND", instrumentId: 4271, name: "Vanguard Total Bond Market ETF", weight: 15,
      shortRationale: "US investment-grade bonds — late-cycle rates ballast.",
      longRationale: "Begins building US bond exposure as the Fed approaches a cutting cycle. Bond returns typically positive when growth slows." },
    { ticker: "TIP", symbolFull: "TIP", instrumentId: 4311, name: "iShares TIPS Bond ETF", weight: 15,
      shortRationale: "US inflation-linked Treasuries — real-yield protection.",
      longRationale: "TIP holds Treasury Inflation-Protected Securities. Hedges the late-cycle scenario where slowing growth coincides with sticky inflation." },
  ],
};

const US_WARNING: Basket = {
  zone: "warning", region: "us",
  title: "Add US defensive exposure",
  thesis: "Multiple US indicators pointing to slowdown. Rotate into US defensive sectors, Treasuries, TIPS and gold.",
  holdings: [
    { ticker: "XLU", symbolFull: "XLU", instrumentId: 3013, name: "Utilities Select Sector SPDR", weight: 18,
      shortRationale: "US utilities — recession-resistant cash flows.",
      longRationale: "Demand for electricity and water is inelastic. Regulated returns provide bond-like cash-flow stability. Outperformed S&P during 2008 and 2020 drawdowns." },
    { ticker: "XLP", symbolFull: "XLP", instrumentId: 3022, name: "Consumer Staples Select Sector SPDR", weight: 18,
      shortRationale: "US staples — necessities-driven demand.",
      longRationale: "Procter & Gamble, Coca-Cola, PepsiCo, Walmart — pricing power and inelastic demand make staples a reliable defensive sector." },
    { ticker: "XLV", symbolFull: "XLV", instrumentId: 3017, name: "Health Care Select Sector SPDR", weight: 14,
      shortRationale: "US healthcare — defensive demand.",
      longRationale: "UnitedHealth, J&J, Eli Lilly. Healthcare demand is largely inelastic to economic conditions." },
    { ticker: "GLD", symbolFull: "GLD", instrumentId: 3025, name: "SPDR Gold Shares", weight: 18,
      shortRationale: "Gold — historic hedge against US equity stress.",
      longRationale: "Largest physical-gold ETF (~$70bn AUM). Outperforms when equities fall and the Fed eases." },
    { ticker: "IEF", symbolFull: "IEF", instrumentId: 3101, name: "iShares 7-10 Year Treasury Bond ETF", weight: 12,
      shortRationale: "Intermediate US Treasuries — pure rates exposure.",
      longRationale: "Pure intermediate-duration Treasury play, no credit risk. Direct hedge against US equity drawdown via expected Fed cuts." },
    { ticker: "TIP", symbolFull: "TIP", instrumentId: 4311, name: "iShares TIPS Bond ETF", weight: 10,
      shortRationale: "US inflation-linked Treasuries — stagflation hedge.",
      longRationale: "Real-yield protection — covers the scenario where slowdown coincides with inflation that doesn't fully roll over." },
    { ticker: "BND", symbolFull: "BND", instrumentId: 4271, name: "Vanguard Total Bond Market ETF", weight: 10,
      shortRationale: "US investment-grade bonds.",
      longRationale: "IG bonds typically rally as recession risk rises — rates fall and quality spreads compress." },
  ],
};

const US_STORM: Basket = {
  zone: "storm", region: "us",
  title: "Preserve capital in a US recession",
  thesis: "US recession signals firing. US Treasuries (cash + long duration), TIPS, and gold.",
  holdings: [
    { ticker: "BIL", symbolFull: "BIL", instrumentId: 4407, name: "SPDR Bloomberg 1-3 Month T-Bill ETF", weight: 28,
      shortRationale: "US T-bills — high-yield cash position.",
      longRationale: "1-3 month US T-Bills. Effectively a high-yield cash position with near-zero duration risk. Safest deployable-cash position in USD." },
    { ticker: "TLT", symbolFull: "TLT", instrumentId: 3020, name: "iShares 20+ Year Treasury Bond ETF", weight: 22,
      shortRationale: "Long US Treasuries — convex play on Fed cuts.",
      longRationale: "When the Fed cuts during recession, long-duration Treasuries rally hardest. ~17yr duration means a few hundred bps of cuts can drive 20%+ returns." },
    { ticker: "TIP", symbolFull: "TIP", instrumentId: 4311, name: "iShares TIPS Bond ETF", weight: 15,
      shortRationale: "US inflation-linked Treasuries — real-yield insurance.",
      longRationale: "Hedges the stagflationary tail — Treasury credit safety with explicit CPI uplift if inflation persists." },
    { ticker: "SHV", symbolFull: "SHV", instrumentId: 4321, name: "iShares Short Treasury Bond ETF", weight: 10,
      shortRationale: "0-1 year US Treasuries — slightly more yield than BIL.",
      longRationale: "Complements BIL with a touch more duration but still effectively cash-like." },
    { ticker: "GLD", symbolFull: "GLD", instrumentId: 3025, name: "SPDR Gold Shares", weight: 20,
      shortRationale: "Gold — outperforms during equity stress and easing.",
      longRationale: "Real rates fall and currency-debasement fears rise during US recessions. The most liquid physical-gold vehicle." },
    { ticker: "XLU", symbolFull: "XLU", instrumentId: 3013, name: "Utilities Select Sector SPDR", weight: 5,
      shortRationale: "US utilities — defensive equity remnant.",
      longRationale: "Small remaining US equity exposure. Most resilient sector in deep drawdowns." },
  ],
};

// ============================================================================
// EU — hedging eurozone risk with euro-correlated UCITS (EUR)
// ============================================================================

const EU_CLEAR: Basket = {
  zone: "clear", region: "eu",
  title: "Position for eurozone upside",
  thesis: "Eurozone indicators benign. European equity exposure with growth and home tilts.",
  holdings: [
    { ticker: "EXSA", symbolFull: "EXSA", instrumentId: 8031, name: "iShares STOXX Europe 600 UCITS ETF", weight: 35,
      shortRationale: "Broad European equity — 600 large/mid caps across the eurozone+.",
      longRationale: "EXSA is the canonical broad-Europe equity vehicle on Xetra. Captures the full STOXX Europe 600 — the de-facto European equity benchmark. 0.20% TER." },
    { ticker: "DAXEX", symbolFull: "DAXEX.DE", instrumentId: 3401, name: "iShares Core DAX UCITS ETF", weight: 20,
      shortRationale: "German DAX — Europe's largest economy.",
      longRationale: "Direct exposure to Germany's 40 largest companies. Germany is the eurozone's economic anchor; DAX moves track eurozone growth signals tightly. Substituted for DBXD." },
    { ticker: "IQQM", symbolFull: "IQQM.DE", instrumentId: 10643, name: "iShares EURO STOXX Mid UCITS ETF", weight: 15,
      shortRationale: "European mid-caps — domestic-revenue exposure.",
      longRationale: "Mid-caps derive more revenue from home eurozone markets than the large-cap STOXX 600. Higher beta to eurozone growth specifically. Substituted for EXSI." },
    { ticker: "VWCG", symbolFull: "VWCG.L", instrumentId: 13558, name: "Vanguard FTSE Developed Europe UCITS ETF", weight: 20,
      shortRationale: "Developed Europe core — Vanguard's low-TER vehicle.",
      longRationale: "Vanguard's European UCITS core, very low TER. Diversified across sectors and major continental economies. Substituted for VEUR." },
    { ticker: "EIMI", symbolFull: "EIMI.L", instrumentId: 15435, name: "iShares Core MSCI EM IMI UCITS ETF", weight: 10,
      shortRationale: "Emerging markets — global growth beta.",
      longRationale: "Some EM exposure as a high-beta complement when global conditions are benign. Sized small." },
  ],
};

const EU_WATCH: Basket = {
  zone: "watch", region: "eu",
  title: "Lean toward eurozone quality",
  thesis: "Yellow flags in eurozone. Rotate toward dividend stocks and start adding euro-bond ballast.",
  holdings: [
    { ticker: "VGWD", symbolFull: "VGWD.DE", instrumentId: 10560, name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF", weight: 28,
      shortRationale: "Global high-dividend factor — defensive equity income.",
      longRationale: "Substituted for EUDV (Euro Div Aristocrats not on eToro). VGWD covers ~1,800 high-yield stocks worldwide; defensive equity factor that historically outperforms in late-cycle environments." },
    { ticker: "EXSA", symbolFull: "EXSA", instrumentId: 8031, name: "iShares STOXX Europe 600 UCITS ETF", weight: 22,
      shortRationale: "Broad European core — keeps participation.",
      longRationale: "Maintains broad European equity exposure if signals turn out to be false alarms." },
    { ticker: "DAXEX", symbolFull: "DAXEX.DE", instrumentId: 3401, name: "iShares Core DAX UCITS ETF", weight: 15,
      shortRationale: "German DAX — eurozone anchor.",
      longRationale: "Germany is the eurozone economic engine. Direct DAX exposure tracks eurozone fortunes most tightly." },
    { ticker: "EUNA", symbolFull: "EUNA.DE", instrumentId: 10586, name: "iShares Core Global Aggregate Bond UCITS ETF (EUR Hedged)", weight: 20,
      shortRationale: "EUR-hedged global IG bonds — late-cycle ballast.",
      longRationale: "Global aggregate bonds in EUR-hedged wrapper. Begins building euro fixed-income as the ECB approaches an easing cycle." },
    { ticker: "IBCI", symbolFull: "IBCI.DE", instrumentId: 10585, name: "iShares EUR Inflation Linked Govt Bond UCITS ETF", weight: 15,
      shortRationale: "Euro inflation-linked govt bonds — real-yield protection.",
      longRationale: "Euro-area inflation-linked sovereign bonds. The euro equivalent of TIP for hedging stagflation." },
  ],
};

const EU_WARNING: Basket = {
  zone: "warning", region: "eu",
  title: "Add eurozone defensive exposure",
  thesis: "Multiple eurozone indicators pointing to slowdown. European defensives, gold, govt bonds, inflation-linked.",
  holdings: [
    { ticker: "SXDPEX", symbolFull: "SXDPEX.DE", instrumentId: 10618, name: "iShares STOXX Europe 600 Health Care UCITS ETF", weight: 18,
      shortRationale: "European healthcare — defensive sector with inelastic demand.",
      longRationale: "Novo Nordisk, Roche, AstraZeneca, Sanofi. European healthcare giants with global revenue and inelastic demand. Substituted for EXH9." },
    { ticker: "UTI", symbolFull: "UTI.PA", instrumentId: 15320, name: "Amundi STOXX Europe 600 Utilities UCITS ETF Acc", weight: 14,
      shortRationale: "European utilities — recession-resistant cash flows.",
      longRationale: "Iberdrola, Enel, RWE, National Grid. Regulated returns provide bond-like stability through downturns. Substituted for EXH4." },
    { ticker: "FOO", symbolFull: "FOO.PA", instrumentId: 15316, name: "Amundi STOXX Europe 600 Consumer Staples UCITS ETF Acc", weight: 13,
      shortRationale: "European staples — necessities-driven demand.",
      longRationale: "Nestlé, L'Oréal, Unilever, Reckitt. Pricing power and inelastic demand — the European staples factor. Substituted for EXH3." },
    { ticker: "IGLN", symbolFull: "IGLN.L", instrumentId: 15440, name: "iShares Physical Gold ETC", weight: 18,
      shortRationale: "Gold — historic hedge against equity stress (UCITS).",
      longRationale: "Largest UCITS physical-gold vehicle on LSE. Outperforms when equities fall and central banks ease. Substituted for SGLN." },
    { ticker: "XY4P", symbolFull: "XY4P.DE", instrumentId: 10614, name: "Xtrackers II Eurozone Government Bond Yield Plus UCITS ETF", weight: 15,
      shortRationale: "Eurozone govt bonds — rates ballast.",
      longRationale: "Pure euro-area sovereign exposure. Rallies when the ECB approaches cuts. Substituted for EUNH." },
    { ticker: "IBCI", symbolFull: "IBCI.DE", instrumentId: 10585, name: "iShares EUR Inflation Linked Govt Bond UCITS ETF", weight: 12,
      shortRationale: "Euro inflation-linked — stagflation hedge.",
      longRationale: "Real-yield protection on euro-area sovereigns. Covers the scenario where eurozone slowdown coincides with sticky inflation." },
    { ticker: "EUNA", symbolFull: "EUNA.DE", instrumentId: 10586, name: "iShares Core Global Aggregate Bond UCITS ETF (EUR Hedged)", weight: 10,
      shortRationale: "EUR-hedged global IG bonds.",
      longRationale: "Global aggregate IG bonds rally as recession risk rises and credit spreads compress on quality." },
  ],
};

const EU_STORM: Basket = {
  zone: "storm", region: "eu",
  title: "Preserve capital in a eurozone recession",
  thesis: "Recession signals firing in eurozone. Euro money-market, eurozone govt bonds, euro inflation-linked, gold.",
  holdings: [
    { ticker: "IS3M", symbolFull: "IS3M.DE", instrumentId: 10565, name: "iShares EUR Ultrashort Bond UCITS ETF", weight: 25,
      shortRationale: "Euro ultrashort IG bonds — EUR cash equivalent.",
      longRationale: "Holds 0-1yr euro-denominated investment-grade bonds. The euro equivalent of BIL — high-yield EUR cash position with near-zero duration risk. Substituted for ERNE." },
    { ticker: "XY4P", symbolFull: "XY4P.DE", instrumentId: 10614, name: "Xtrackers II Eurozone Government Bond Yield Plus UCITS ETF", weight: 30,
      shortRationale: "Eurozone govt bonds — direct ECB-cut beneficiary.",
      longRationale: "Pure eurozone sovereign exposure. The home-currency rates play that rallies most predictably when the ECB starts cutting. Bumped to 30% since no long-Bunds 25+ UCITS exists on eToro (former DBXG slot rolled in)." },
    { ticker: "IBCI", symbolFull: "IBCI.DE", instrumentId: 10585, name: "iShares EUR Inflation Linked Govt Bond UCITS ETF", weight: 15,
      shortRationale: "Euro inflation-linked — real-yield insurance.",
      longRationale: "Sovereign credit safety with explicit CPI uplift. Hedges the stagflationary tail in eurozone." },
    { ticker: "IGLN", symbolFull: "IGLN.L", instrumentId: 15440, name: "iShares Physical Gold ETC", weight: 20,
      shortRationale: "Gold — outperforms during equity stress and easing.",
      longRationale: "Real rates fall and currency-debasement fears rise during recessions. Largest UCITS gold vehicle." },
    { ticker: "UTI", symbolFull: "UTI.PA", instrumentId: 15320, name: "Amundi STOXX Europe 600 Utilities UCITS ETF Acc", weight: 10,
      shortRationale: "European utilities — defensive equity remnant.",
      longRationale: "Small remaining European equity exposure. Utilities are the most resilient European sector in deep drawdowns." },
  ],
};

// ============================================================================
// UK — hedging UK risk with UK-correlated UCITS (GBP)
// ============================================================================

const UK_CLEAR: Basket = {
  zone: "clear", region: "uk",
  title: "Position for UK upside",
  thesis: "UK indicators benign. UK equity with FTSE 100 and 250 exposures plus international diversification.",
  holdings: [
    { ticker: "ISF", symbolFull: "ISF.L", instrumentId: 3052, name: "iShares Core FTSE 100 UCITS ETF (Dist)", weight: 25,
      shortRationale: "FTSE 100 — UK large-caps with global revenue.",
      longRationale: "100 largest UK-listed companies. Heavy on energy, financials, miners, pharma — value-tilted vs US tech-heavy indices. Substituted for VUKE (Vanguard FTSE 100 not on eToro)." },
    { ticker: "MIDD", symbolFull: "MIDD.L", instrumentId: 6466, name: "iShares FTSE 250 UCITS ETF", weight: 25,
      shortRationale: "FTSE 250 — UK mid-caps, more domestic exposure.",
      longRationale: "FTSE 250 derives ~50%+ revenue from UK economy vs ~25% for FTSE 100. Higher beta to UK growth specifically — the cleanest pure-play UK economic exposure. Substituted for VMID." },
    { ticker: "VUSA", symbolFull: "VUSA.NV", instrumentId: 14232, name: "Vanguard S&P 500 UCITS ETF (NV listing)", weight: 20,
      shortRationale: "US large-cap diversification.",
      longRationale: "International diversification away from UK-only concentration. The US market is too large to ignore in any global allocation." },
    { ticker: "VWCG", symbolFull: "VWCG.L", instrumentId: 13558, name: "Vanguard FTSE Developed Europe UCITS ETF", weight: 15,
      shortRationale: "Developed Europe — geographic diversification.",
      longRationale: "European developed-market exposure complements UK home tilt. Captures continental cyclical recovery. Substituted for VEUR." },
    { ticker: "EIMI", symbolFull: "EIMI.L", instrumentId: 15435, name: "iShares Core MSCI EM IMI UCITS ETF", weight: 15,
      shortRationale: "Emerging markets — high beta to global growth.",
      longRationale: "EM equity for benign global conditions. Diversifies away from the UK's heavily-financialised equity composition." },
  ],
};

const UK_WATCH: Basket = {
  zone: "watch", region: "uk",
  title: "Lean toward UK quality",
  thesis: "Yellow flags in UK. Rotate toward FTSE 100 (defensive sector mix), and start adding gilt and inflation-linked ballast.",
  holdings: [
    { ticker: "ISF", symbolFull: "ISF.L", instrumentId: 3052, name: "iShares Core FTSE 100 UCITS ETF (Dist)", weight: 30,
      shortRationale: "FTSE 100 — defensive sector mix.",
      longRationale: "FTSE 100 is heavy on staples (Unilever, Diageo), pharma (AstraZeneca, GSK), utilities (National Grid) — sectors that hold up better than mid-caps in slowdowns." },
    { ticker: "VGWD", symbolFull: "VGWD.DE", instrumentId: 10560, name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF", weight: 20,
      shortRationale: "Global dividend complement.",
      longRationale: "Global dividend aristocrats hedge UK-only concentration. Dividend-payers historically outperform in late-cycle environments. Substituted for VHYG (GBP variant not on eToro)." },
    { ticker: "MIDD", symbolFull: "MIDD.L", instrumentId: 6466, name: "iShares FTSE 250 UCITS ETF", weight: 15,
      shortRationale: "FTSE 250 — keeps domestic-economy participation.",
      longRationale: "Maintains domestic UK exposure. Reduce vs Clear basket but keep meaningful position if UK signals turn out to be false alarms." },
    { ticker: "SYBG", symbolFull: "SYBG.DE", instrumentId: 10641, name: "SPDR Bloomberg UK Gilt UCITS ETF", weight: 20,
      shortRationale: "UK gilts — home-currency rates ballast.",
      longRationale: "Direct UK government bond exposure in GBP. Begins adding gilt exposure as the BoE approaches an easing cycle. Substituted for IGLT (iShares UK Gilt UCITS not on eToro)." },
    { ticker: "IBCI", symbolFull: "IBCI.DE", instrumentId: 10585, name: "iShares EUR Inflation Linked Govt Bond UCITS ETF", weight: 15,
      shortRationale: "Inflation-linked govt bonds — real-yield protection.",
      longRationale: "Substituted for INXG (UK index-linked gilts not available on eToro as UCITS). IBCI is € linkers, not £, so this hedges general inflation pressure rather than UK-specific RPI — a known compromise." },
  ],
};

const UK_WARNING: Basket = {
  zone: "warning", region: "uk",
  title: "Add UK defensive exposure",
  thesis: "Multiple UK indicators pointing to slowdown. UK-correlated defensives, gilts, inflation-linked, gold.",
  holdings: [
    { ticker: "ISF", symbolFull: "ISF.L", instrumentId: 3052, name: "iShares Core FTSE 100 UCITS ETF (Dist)", weight: 18,
      shortRationale: "FTSE 100 — defensive UK large-caps.",
      longRationale: "FTSE 100's dominant defensive sector mix (staples, pharma, utilities) makes it the most resilient UK equity vehicle in a domestic slowdown." },
    { ticker: "SXDPEX", symbolFull: "SXDPEX.DE", instrumentId: 10618, name: "iShares STOXX Europe 600 Health Care UCITS ETF", weight: 12,
      shortRationale: "Healthcare — UK pharma giants AZN/GSK plus continental peers.",
      longRationale: "Heavy UK weight via AstraZeneca and GSK plus continental defensive healthcare. Inelastic demand sector." },
    { ticker: "UTI", symbolFull: "UTI.PA", instrumentId: 15320, name: "Amundi STOXX Europe 600 Utilities UCITS ETF Acc", weight: 10,
      shortRationale: "Utilities — incl. UK names like National Grid.",
      longRationale: "European utilities including UK names. Regulated cash flows are recession-resistant." },
    { ticker: "IGLN", symbolFull: "IGLN.L", instrumentId: 15440, name: "iShares Physical Gold ETC", weight: 18,
      shortRationale: "Gold — historic hedge, GBP-tradeable on LSE.",
      longRationale: "Largest UCITS physical-gold vehicle, LSE-listed. Outperforms when equities fall and central banks ease." },
    { ticker: "SYBG", symbolFull: "SYBG.DE", instrumentId: 10641, name: "SPDR Bloomberg UK Gilt UCITS ETF", weight: 18,
      shortRationale: "UK gilts — pure GBP-rates exposure.",
      longRationale: "UK government bonds. Direct hedge against UK equity drawdown via expected BoE cuts." },
    { ticker: "IBCI", symbolFull: "IBCI.DE", instrumentId: 10585, name: "iShares EUR Inflation Linked Govt Bond UCITS ETF", weight: 14,
      shortRationale: "Inflation-linked govt bonds — best available linker on eToro.",
      longRationale: "Substituted for INXG (UK linkers not on eToro). IBCI hedges general inflation but in EUR rather than GBP — close substitute, not perfect." },
    { ticker: "ERNS", symbolFull: "ERNS.L", instrumentId: 14495, name: "iShares GBP Ultrashort Bond UCITS ETF", weight: 10,
      shortRationale: "GBP ultrashort bonds — start adding cash equivalent.",
      longRationale: "0-1yr GBP-denominated IG bonds. Begins building GBP cash buffer as the cycle ages." },
  ],
};

const UK_STORM: Basket = {
  zone: "storm", region: "uk",
  title: "Preserve capital in a UK recession",
  thesis: "UK recession signals firing. GBP cash, UK gilts, inflation-linked (€-fallback), gold.",
  holdings: [
    { ticker: "ERNS", symbolFull: "ERNS.L", instrumentId: 14495, name: "iShares GBP Ultrashort Bond UCITS ETF", weight: 28,
      shortRationale: "GBP ultrashort bonds — high-yield GBP cash position.",
      longRationale: "0-1yr GBP-denominated IG bonds. The GBP equivalent of BIL — high-yield cash position with near-zero duration risk for UK investors." },
    { ticker: "SYBG", symbolFull: "SYBG.DE", instrumentId: 10641, name: "SPDR Bloomberg UK Gilt UCITS ETF", weight: 22,
      shortRationale: "UK gilts — direct BoE-cut beneficiary.",
      longRationale: "Pure UK government bond exposure. The home-currency rates play that rallies most predictably when the BoE starts cutting." },
    { ticker: "IBCI", symbolFull: "IBCI.DE", instrumentId: 10585, name: "iShares EUR Inflation Linked Govt Bond UCITS ETF", weight: 17,
      shortRationale: "Inflation-linked govt bonds (EUR, fallback).",
      longRationale: "Substituted for INXG (UK linkers not available on eToro). The eurozone linker is the best UCITS inflation hedge available, accepting the EUR vs GBP currency mismatch as the cost of using eToro's UCITS catalog." },
    { ticker: "IGLN", symbolFull: "IGLN.L", instrumentId: 15440, name: "iShares Physical Gold ETC", weight: 23,
      shortRationale: "Gold — outperforms during equity stress and easing.",
      longRationale: "Real rates fall and currency-debasement fears rise during UK recessions. The largest UCITS physical-gold vehicle, GBP-traded on LSE." },
    { ticker: "UTI", symbolFull: "UTI.PA", instrumentId: 15320, name: "Amundi STOXX Europe 600 Utilities UCITS ETF Acc", weight: 10,
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
    { ticker: "VWRP", symbolFull: "VWRP.L", instrumentId: 14462, name: "Vanguard FTSE All-World UCITS ETF (USD Dis)", weight: 50,
      shortRationale: "Global equity in one ticker — distributing share class.",
      longRationale: "Vanguard's FTSE All-World UCITS — ~3,700 stocks across DM and EM. Substituted for VWRA (Acc share class not on eToro); VWRP is the same fund, distributing rather than accumulating." },
    { ticker: "CNDX", symbolFull: "CNDX.L", instrumentId: 8015, name: "iShares NASDAQ 100 UCITS ETF", weight: 20,
      shortRationale: "Nasdaq-100 UCITS — global growth tilt.",
      longRationale: "Adds tech/growth tilt on top of the world-equity base. Substituted for EQQQ (Invesco Nasdaq UCITS not on eToro)." },
    { ticker: "EIMI", symbolFull: "EIMI.L", instrumentId: 15435, name: "iShares Core MSCI EM IMI UCITS ETF", weight: 15,
      shortRationale: "EM overweight — extra growth-beta.",
      longRationale: "Brings EM weighting above the ~10% included in VWRP. High-beta exposure when global conditions are clearly benign." },
    { ticker: "VWCG", symbolFull: "VWCG.L", instrumentId: 13558, name: "Vanguard FTSE Developed Europe UCITS ETF", weight: 15,
      shortRationale: "Europe overweight — value diversification.",
      longRationale: "Tilts away from US-heavy world indices toward European value. Lower P/Es provide some valuation cushion." },
  ],
};

const GLOBAL_WATCH: Basket = {
  zone: "watch", region: "global",
  title: "Lean toward global quality",
  thesis: "Some global indicators flashing yellow. Quality and dividend tilts with global bond ballast.",
  holdings: [
    { ticker: "VGWD", symbolFull: "VGWD.DE", instrumentId: 10560, name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF", weight: 30,
      shortRationale: "Global high-dividend factor.",
      longRationale: "~1,800 high-yield stocks worldwide. Defensive equity factor that historically outperforms in late-cycle environments. Substituted for VHYL." },
    { ticker: "VWRP", symbolFull: "VWRP.L", instrumentId: 14462, name: "Vanguard FTSE All-World UCITS ETF (USD Dis)", weight: 25,
      shortRationale: "Broad global equity core.",
      longRationale: "Maintains diversified global exposure if signals are false alarms." },
    { ticker: "AGGU", symbolFull: "AGGU.L", instrumentId: 13553, name: "iShares Core Global Aggregate Bond UCITS ETF (USD)", weight: 20,
      shortRationale: "Global IG bond ballast.",
      longRationale: "Global investment-grade bond market in UCITS wrapper. Substituted for AGGH (the EUR-hedged share class isn't on eToro; AGGU is the USD share of the same fund)." },
    { ticker: "VWCG", symbolFull: "VWCG.L", instrumentId: 13558, name: "Vanguard FTSE Developed Europe UCITS ETF", weight: 15,
      shortRationale: "European value tilt.",
      longRationale: "Lower-P/E European exposure as a defensive tilt within equities." },
    { ticker: "IGLN", symbolFull: "IGLN.L", instrumentId: 15440, name: "iShares Physical Gold ETC", weight: 10,
      shortRationale: "Early defensive gold position.",
      longRationale: "Gold tends to outperform when central banks shift dovish. Small starter position." },
  ],
};

const GLOBAL_WARNING: Basket = {
  zone: "warning", region: "global",
  title: "Add global defensive exposure",
  thesis: "Multiple global indicators pointing to slowdown. Defensives across regions, gold, hedged bonds, US Treasuries.",
  holdings: [
    { ticker: "SXDPEX", symbolFull: "SXDPEX.DE", instrumentId: 10618, name: "iShares STOXX Europe 600 Health Care UCITS ETF", weight: 18,
      shortRationale: "Defensive healthcare with global revenue.",
      longRationale: "European healthcare giants with global revenue streams — defensive earnings with international diversification." },
    { ticker: "UTI", symbolFull: "UTI.PA", instrumentId: 15320, name: "Amundi STOXX Europe 600 Utilities UCITS ETF Acc", weight: 12,
      shortRationale: "Utilities — recession-resistant cash flows.",
      longRationale: "Utility demand is inelastic to economic conditions. Bond-like cash-flow stability." },
    { ticker: "IGLN", symbolFull: "IGLN.L", instrumentId: 15440, name: "iShares Physical Gold ETC", weight: 20,
      shortRationale: "Gold — historic hedge against equity stress.",
      longRationale: "The most liquid UCITS gold vehicle. Outperforms when equities fall and central banks ease." },
    { ticker: "AGGU", symbolFull: "AGGU.L", instrumentId: 13553, name: "iShares Core Global Aggregate Bond UCITS ETF (USD)", weight: 15,
      shortRationale: "Global IG bonds.",
      longRationale: "IG bonds typically rally as recession risk rises." },
    { ticker: "DTLA", symbolFull: "DTLA.L", instrumentId: 13564, name: "iShares USD Treasury Bond 20+yr UCITS ETF", weight: 20,
      shortRationale: "Long US Treasuries — global safe-haven duration.",
      longRationale: "USD long bonds are the world's safe-haven duration complex during global stress. Convex hedge against equity drawdown. Substituted for IDTL (same fund family, this is the LSE listing)." },
    { ticker: "SEMB", symbolFull: "SEMB.L", instrumentId: 3058, name: "iShares J.P. Morgan $ Emerging Markets Bond UCITS ETF", weight: 15,
      shortRationale: "USD EM sovereign bonds — yield with diversification.",
      longRationale: "USD-denominated emerging-market sovereign bonds add yield without single-country credit risk. Substituted for EIMB (same fund family)." },
  ],
};

const GLOBAL_STORM: Basket = {
  zone: "storm", region: "global",
  title: "Preserve capital in a global recession",
  thesis: "Recession signals firing globally. USD T-bills, long Treasuries, gold, global IG bonds.",
  holdings: [
    { ticker: "IB01", symbolFull: "IB01.L", instrumentId: 1442, name: "iShares $ Treasury Bond 0-1yr UCITS ETF", weight: 30,
      shortRationale: "USD T-bills — high-yield cash position.",
      longRationale: "0-1yr US Treasury Bills in UCITS form. The world's safest deployable-cash position. Near-zero duration risk." },
    { ticker: "DTLA", symbolFull: "DTLA.L", instrumentId: 13564, name: "iShares USD Treasury Bond 20+yr UCITS ETF", weight: 25,
      shortRationale: "Long US Treasuries — convex play on Fed cuts.",
      longRationale: "When the Fed cuts during global recession, long Treasuries rally hardest. The world's preferred convex duration trade." },
    { ticker: "IGLN", symbolFull: "IGLN.L", instrumentId: 15440, name: "iShares Physical Gold ETC", weight: 25,
      shortRationale: "Gold — performs during equity stress and easing cycles.",
      longRationale: "Real rates fall and currency-debasement fears rise during global recessions. The most liquid UCITS gold vehicle." },
    { ticker: "AGGU", symbolFull: "AGGU.L", instrumentId: 13553, name: "iShares Core Global Aggregate Bond UCITS ETF (USD)", weight: 10,
      shortRationale: "Global IG bonds.",
      longRationale: "Diversifies the heavy USD-Treasury tilt with global IG bond exposure. Investment-grade only, so credit risk minimised." },
    { ticker: "UTI", symbolFull: "UTI.PA", instrumentId: 15320, name: "Amundi STOXX Europe 600 Utilities UCITS ETF Acc", weight: 10,
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

/** Returns every (ticker, symbolFull, instrumentId) across all baskets. */
export function allHoldings(): Array<{ ticker: string; symbolFull: string; instrumentId: number }> {
  const seen = new Map<string, { ticker: string; symbolFull: string; instrumentId: number }>();
  for (const region of Object.values(BASKETS)) {
    for (const basket of Object.values(region)) {
      for (const h of basket.holdings) {
        if (!seen.has(h.symbolFull)) {
          seen.set(h.symbolFull, {
            ticker: h.ticker,
            symbolFull: h.symbolFull,
            instrumentId: h.instrumentId,
          });
        }
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.symbolFull.localeCompare(b.symbolFull));
}