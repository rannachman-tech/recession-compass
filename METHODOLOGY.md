# Recession Compass — Methodology

**v1.5 · 2026-05-02 · Internal / compliance distribution only**

## What

A single 0–100 number per region (US, Eurozone, UK, Global) that compresses 6–8 public economic indicators into one read. Higher = more recessionary signals firing. Bands map to plain-English copy:

| Score | Phase |
|---|---|
| 0–30 | Skies are clear |
| 30–60 | Storm watch |
| 60–80 | Storm warning |
| 80+ | Storm in progress |

## Why

Retail investors get a flood of macro headlines and no scoreboard. The barometer answers one question — *"is a recession coming?"* — using only free public data, with every indicator and weight made explicit. No AI guesses. No black box. Same input → same number every time.

## How — the calculation

**Step 1.** For each indicator, fetch the latest observation from FRED. Apply the configured transform: level (e.g., yield curve), year-over-year change in percentage points (e.g., unemployment), or year-over-year percent change (e.g., GDP).

**Step 2.** Map the raw value to a 0–100 sub-score using a linear interpolation between two calibrated anchors:

```
subScore = clamp(0, 100, (value − calm) / (alarm − calm) × 100)
```

`calm` = the value at which we'd score 0 (no concern). `alarm` = the value at which we'd score 100 (recession-grade reading). Anchors come from each indicator's historical behaviour around past recessions.

**Step 3.** Composite is the weighted average of the per-indicator sub-scores:

```
score = Σ(weight_i × subScore_i) / Σ(weight_i)
```

Weights sum to 100 per region.

**Step 4.** A confidence band of ±1.5 × stdev(sub-scores), capped at ±35, shades the needle. Wide band = indicators disagree; narrow band = they agree.

## Calibration — indicator weights

| | US | Eurozone | UK | Global composite |
|---|---|---|---|---|
| Yield curve (10y–2y) | 25 | 25 (DE) | 25 | — |
| Sahm rule | 25 | — | — | — |
| Unemployment YoY change | 10 | 25 | 25 | — |
| Initial jobless claims YoY | 10 | — | — | — |
| Industrial production YoY | 10 | — | — | — |
| OECD Composite Leading Indicator | 10 | 20 | 20 | China 20, Japan 15 |
| Real GDP YoY | 5 | 12 | 12 | — |
| Consumer sentiment / confidence | 5 | 13 | 13 | — |
| HICP YoY | — | 5 | — | — |
| BoE overnight rate (12m change) | — | — | 5 | — |
| US sub-score | — | — | — | 35 |
| Eurozone sub-score | — | — | — | 30 |
| **Total** | **100** | **100** | **100** | **100** |

## Sources (all FRED)

- **US**: T10Y2Y, SAHMREALTIME, ICSA, INDPRO, USALOLITOAASTSAM, UNRATE, GDPC1, UMCSENT
- **Eurozone**: IRLTLT01DEM156N − IR3TIB01DEM156N, mean(LRHUTTTT{DE,FR,IT,ES}M156S) for unemployment, mean(DEU,FRA,ITA LOLITOAASTSAM) for CLI, CLVMNACSCAB1GQEA19, CSCICP02EZM460S, CP0000EZ19M086NEST
- **UK**: IRLTLT01GBM156N − IR3TIB01GBM156N, LRHUTTTTGBM156S, GBRLOLITOAASTSAM, NGDPRSAXDCGBQ, CSCICP02GBM460S, IUDSOIA
- **Global**: composite(US) + composite(EU) + CHNLOLITOAASTSAM + JPNLOLITOAASTSAM

Recession bands shaded on the deep history chart: NBER (US), CEPR EABCDC (Eurozone), ONS (UK), OECD-dated global slowdowns (Global).

## Staleness guard

Any indicator whose latest observation is older than **240 days** is flagged `stale: true`, given a neutral sub-score of 50, and surfaced with a "Stale" badge in the gauge header. This prevents discontinued FRED mirrors (which is how the Philly Fed state-leading index, last published 2020-02, was silently corrupting the US score before v1.1).

## What this score is not

- Not a forecast model. We do not train on historical recessions; the anchors are hand-calibrated and transparent.
- Not a Bayesian probability. The 0–100 is a calibrated severity index.
- Not financial advice.
- Will sometimes peg high during slowdowns that don't get officially-dated as recessions, and vice-versa.

## Refresh cadence

GitHub Actions cron runs every 6 hours. Each run pulls the latest observations from FRED, recomputes all four region composites, commits the resulting JSON to `data/recession-{region}.json`, which triggers a Vercel redeploy.

## Trade-on-eToro baskets — region × phase mapping

The "Trade on eToro" CTA in each region opens a basket sized to that region's current phase. Region = the *economy being hedged*, not the user's regulatory zone — e.g. UK Storm holds GBP-correlated assets (gilts, linkers, GBP cash, gold), even for a non-UK user, because the stress being hedged is UK-specific. US baskets stay in US-listed ETFs; EU/UK/Global baskets use UCITS-wrapped equivalents so they trade for European-domiciled users on eToro.

Weights below are % of the user-entered amount. The user picks the dollar amount inside the modal; the system applies the weighting and submits market orders.

All 38 unique instruments below have been verified against eToro's public catalog (`api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments`) and the matched `instrumentId` is stored alongside each ticker in `lib/baskets.ts`, so the trade flow can submit market orders directly without a runtime symbol-resolution step.

### US — hedging US-economy risk (USD-listed)

| Phase | Holdings (% weight) |
|---|---|
| Clear | VTI 40, QQQ 25, VEA 15, VWO 10, SCHD 10 |
| Watch | SCHD 30, DGRO 20, VTI 20, BND 15, TIP 15 |
| Warning | XLU 18, XLP 18, XLV 14, GLD 18, IEF 12, TIP 10, BND 10 |
| Storm | BIL 28, TLT 22, TIP 15, SHV 10, GLD 20, XLU 5 |

### Eurozone — hedging eurozone risk (EUR, UCITS)

| Phase | Holdings (% weight) |
|---|---|
| Clear | EXSA 35, DAXEX.DE 20, IQQM.DE 15, VWCG.L 20, EIMI.L 10 |
| Watch | VGWD.DE 28, EXSA 22, DAXEX.DE 15, EUNA.DE 20, IBCI.DE 15 |
| Warning | SXDPEX.DE 18, UTI.PA 14, FOO.PA 13, IGLN.L 18, XY4P.DE 15, IBCI.DE 12, EUNA.DE 10 |
| Storm | IS3M.DE 25, XY4P.DE 30, IBCI.DE 15, IGLN.L 20, UTI.PA 10 |

### UK — hedging UK risk (GBP, UCITS)

| Phase | Holdings (% weight) |
|---|---|
| Clear | ISF.L 25, MIDD.L 25, VUSA.NV 20, VWCG.L 15, EIMI.L 15 |
| Watch | ISF.L 30, VGWD.DE 20, MIDD.L 15, SYBG.DE 20, IBCI.DE 15 |
| Warning | ISF.L 18, SXDPEX.DE 12, UTI.PA 10, IGLN.L 18, SYBG.DE 18, IBCI.DE 14, ERNS.L 10 |
| Storm | ERNS.L 28, SYBG.DE 22, IBCI.DE 17, IGLN.L 23, UTI.PA 10 |

### Global — hedging a global slowdown (USD/UCITS safe-haven complex)

| Phase | Holdings (% weight) |
|---|---|
| Clear | VWRP.L 50, CNDX.L 20, EIMI.L 15, VWCG.L 15 |
| Watch | VGWD.DE 30, VWRP.L 25, AGGU.L 20, VWCG.L 15, IGLN.L 10 |
| Warning | SXDPEX.DE 18, UTI.PA 12, IGLN.L 20, AGGU.L 15, DTLA.L 20, SEMB.L 15 |
| Storm | IB01.L 30, DTLA.L 25, IGLN.L 25, AGGU.L 10, UTI.PA 10 |

### Substitution notes (catalog reality vs. ideal picks)

A handful of ideal picks aren't on eToro's catalog and have been replaced with the closest tradeable equivalent: **VYM → DGRO** (Vanguard High Div not on eToro; iShares Dividend Growth is the nearest US dividend-quality fund). **VUKE → ISF.L**, **VMID → MIDD.L**, **VEUR → VWCG.L**, **VUSA → VUSA.NV** (different listings of equivalent funds). **VWRA → VWRP.L** (distributing rather than accumulating share class of the same FTSE All-World UCITS). **EQQQ → CNDX.L** (iShares Nasdaq UCITS). **EUDV / VHYL / VHYG → VGWD.DE** (no Euro Div Aristocrats on eToro — the Vanguard global high-dividend UCITS is the broadest available). **EXH9/EXH4/EXH3 → SXDPEX.DE / UTI.PA / FOO.PA** (iShares STOXX 600 sector funds or Amundi equivalents). **EXSI → IQQM.DE**, **DBXD → DAXEX.DE**, **DBXG → XY4P.DE bumped weight** (no long-Bunds 25+ UCITS on eToro). **IGLT → SYBG.DE** (SPDR UK Gilt — only UK gilt UCITS on eToro). **INXG → IBCI.DE** (no UK index-linked gilt UCITS on eToro; we fall back to € linkers as the closest available inflation hedge — a known compromise). **AGGH → AGGU.L**, **IDTL → DTLA.L**, **EIMB → SEMB.L**, **SGLN → IGLN.L**, **ERNE → IS3M.DE** (different listings/share classes of the same iShares funds).

### Ticker dictionary

US-listed (used in US baskets only):

- **VTI** Vanguard Total Stock Market · **QQQ** Invesco Nasdaq-100 · **VEA** Vanguard FTSE Developed Mkts · **VWO** Vanguard FTSE EM · **SCHD** Schwab US Dividend Equity · **VYM** Vanguard High Dividend Yield · **BND** Vanguard Total Bond Market · **TIP** iShares TIPS · **IEF** iShares 7-10y Treasury · **TLT** iShares 20+y Treasury · **BIL** SPDR 1-3M T-Bill · **SHV** iShares Short Treasury · **GLD** SPDR Gold Shares · **XLU** Utilities Select Sector SPDR · **XLP** Consumer Staples Select Sector SPDR · **XLV** Health Care Select Sector SPDR

UCITS (used in EU / UK / Global baskets):

- **EXSA** iShares STOXX Europe 600 · **EXSI** iShares STOXX Europe Mid 200 · **EXH9** iShares STOXX Europe 600 Health Care · **EXH4** iShares STOXX Europe 600 Utilities · **EXH3** iShares STOXX Europe 600 Personal & Household Goods · **DBXD** Xtrackers DAX · **DBXG** Xtrackers Eurozone Govt Bond 25+ · **VEUR** Vanguard FTSE Developed Europe · **VUKE** Vanguard FTSE 100 · **VMID** Vanguard FTSE 250 · **VUSA** Vanguard S&P 500 · **VWRA** Vanguard FTSE All-World (USD Acc) · **EQQQ** Invesco Nasdaq-100 UCITS · **EIMI** iShares Core MSCI EM IMI · **EUDV** SPDR S&P Euro Dividend Aristocrats · **VHYL** Vanguard FTSE All-World High Dividend Yield · **VHYG** Vanguard FTSE All-World High Dividend Yield (GBP share) · **EUNA** iShares Core € Corp Bond · **EUNH** iShares Euro Govt Bond Capped 5.5-10.5y · **IBCI** iShares € Inflation Linked Govt Bond · **ERNE** iShares € Ultrashort Bond · **ERNS** iShares £ Ultrashort Bond · **IGLT** iShares Core UK Gilts · **INXG** iShares £ Index-Linked Gilts · **IDTL** iShares $ Treasury Bond 20+y · **IB01** iShares $ Treasury Bond 0-1y · **AGGH** iShares Core Global Aggregate Bond (Hedged) · **EIMB** iShares JPM $ EM Bond · **SGLN** iShares Physical Gold ETC

### Pre-launch verification

`scripts/verify-baskets.ts` (run via `npm run verify:baskets` — no API keys needed) downloads eToro's public instrument catalog and confirms every `instrumentId` in `lib/baskets.ts` still exists in the catalog with the expected `SymbolFull`. Catches a fund being delisted or renamed before it breaks the trade flow. Required green-light before any change to `lib/baskets.ts` ships to main.

## Changelog

- **v1.5 (2026-05-02)** — Replaced every basket ticker with one verified against eToro's public instrument catalog. 38/38 holdings now have a stored `instrumentId` and are confirmed-tradeable on eToro. Trade flow skips runtime symbol resolution. Notable replacements: VYM→DGRO (Vanguard High Div not on eToro), VWRA→VWRP.L (USD Acc share not on eToro; switch to Dist), IGLT→SYBG.DE (only UK gilt UCITS on eToro is the SPDR), INXG→IBCI.DE fallback (no UK linker UCITS on eToro). Verifier rewritten to use the public catalog (no API keys required).
- **v1.4 (2026-05-02)** — Region-aware ETF baskets. Region now means the economy being hedged (not user's regulatory zone). EU baskets hold euro-correlated assets (Bunds, € inflation-linked, € money-market). UK baskets hold UK-correlated assets (gilts, INXG linkers, £ money-market). US stays USD-listed. Global uses USD/UCITS world safe-haven complex. Added `scripts/verify-baskets.ts` as a pre-launch ticker-availability guard against eToro's catalog.
- **v1.3 (2026-05-01)** — Recalibrated anchors that didn't match historical recession behaviour. OECD CLIs (all 5 instances): calm 100.5 → 101, alarm 98/98.5 → 95 (matching GFC trough of 92–94). Sahm rule: alarm 0.8 → 0.5 (the textbook trigger). US industrial production: calm 4 → 3, alarm −4 → −10 (GFC trough was −15%).
- **v1.2 (2026-05-01)** — Removed EU and UK industrial production indicators (no live FRED mirror). Reweighted both regions across the remaining six indicators. Bumped staleness threshold from 180 to 240 days to accommodate quarterly publishing cadence. Synthesised EU unemployment from DE/FR/IT/ES (the EZ aggregate stopped publishing in 2023). Swapped UK GDP from `CLVMNACSCAB1GQUK` (last 2020) to `NGDPRSAXDCGBQ` (current). Swapped UK Bank Rate from `INTGSTGBM193N` (last 2016) to `IUDSOIA` (SONIA, daily).
- **v1.1 (2026-05-01)** — Replaced 5 stale OECD CLI distributions across US/EU/UK/CN/JP with the maintained amplitude-adjusted variants. Eurozone CLI synthesised from DE/FR/IT (EA19 series gone). Recalibrated EU and UK consumer-confidence anchors from a 100-centred to a 0-centred scale. Added the staleness guard.
- **v1.0 (2026-05-01)** — Initial release. US (FRED), Europe (FRED-mirrored ECB/Eurostat/OECD), UK (FRED-mirrored ONS/BoE/OECD), Global composite (US 35 / EU 30 / CN 20 / JP 15).
