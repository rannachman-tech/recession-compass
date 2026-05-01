import type { RegionId } from "./types";

/**
 * Per-region indicator definitions.
 * v1.3 changes (2026-05-01):
 *  - Recalibrated anchors that didn't match historical recession behaviour.
 *  - OECD CLI: calm 100.5 → 101, alarm 98/98.5 → 95 (matching GFC trough 92-94).
 *  - Sahm rule: alarm 0.8 → 0.5 (matching the textbook trigger).
 *  - US industrial production: calm 4 → 3, alarm -4 → -10 (GFC trough was -15%).
 *
 * v1.2 changes (2026-05-01):
 *  - Removed EU and UK industrial production indicators (no live FRED mirror).
 *  - Reweighted: EU UR 20→25, CLI 15→20, GDP 10→12, sentiment 10→13.
 *  - Reweighted: UK UR 20→25, CLI 15→20, GDP 10→12, sentiment 10→13.
 *
 * v1.1 changes (2026-05-01):
 *  - Swapped USSLIND (discontinued 2020) for USALOLITOAASTSAM (OECD CLI, current).
 *  - Same swap for EU/UK/CN/JP CLIs: -NOSTSAM (discontinued 2022-2024) → -AASTSAM.
 *  - For Eurozone CLI we now synthesise from DEU+FRA+ITA (EA19/EA20 series gone).
 *  - Recalibrated EU & UK consumer-confidence anchors — those series are
 *    0-centred, not 100-centred. Old config was wrong.
 */

export type Transform =
  | "level"
  | "yoy_pp"
  | "yoy_pct"
  | "mom_smoothed_yoy_pct"
  | "diff_3m_pp";

export interface IndicatorConfig {
  id: string;
  label: string;
  series: string;
  transform: Transform;
  unit: string;
  calm: number;
  alarm: number;
  weight: number;
  threshold: number;
  explanation: string;
  formula: string;
  source: string;
}

export interface RegionConfig {
  id: RegionId;
  label: string;
  short: string;
  indicators: IndicatorConfig[];
  bandsLabel: string;
}

const US: RegionConfig = {
  id: "us",
  label: "United States",
  short: "US",
  bandsLabel: "NBER recessions",
  indicators: [
    {
      id: "yield_curve",
      label: "Yield curve (10y–2y)",
      series: "T10Y2Y",
      transform: "level",
      unit: "pp",
      calm: 1.0,
      alarm: -1.0,
      weight: 25,
      threshold: 0,
      explanation:
        "The gap between 10-year and 2-year Treasury yields. When short-term rates exceed long-term ones, history shows a recession typically follows within 6–18 months.",
      formula: "score = lerp(value, calm=+1.0pp → 0, alarm=-1.0pp → 100)",
      source: "FRED: T10Y2Y",
    },
    {
      id: "sahm",
      label: "Sahm rule",
      series: "SAHMREALTIME",
      transform: "level",
      unit: "pp",
      calm: 0.0,
      alarm: 0.5,
      weight: 25,
      threshold: 0.5,
      explanation:
        "Triggers when the 3-month average unemployment rate is 0.5pp above its 12-month low. Fires near the start of every US recession since 1970.",
      formula: "score = lerp(value, calm=0.0pp → 0, alarm=0.5pp → 100)",
      source: "FRED: SAHMREALTIME",
    },
    {
      id: "claims",
      label: "Initial jobless claims (YoY)",
      series: "ICSA",
      transform: "mom_smoothed_yoy_pct",
      unit: "%",
      calm: -10,
      alarm: 30,
      weight: 10,
      threshold: 10,
      explanation:
        "Weekly initial jobless claims, smoothed to 4-week average and compared to the same week last year. A sustained rise typically precedes a downturn.",
      formula: "value = (4wMA(claims) / 4wMA(claims, 52w ago) - 1) × 100",
      source: "FRED: ICSA",
    },
    {
      id: "ism_proxy",
      label: "Industrial production (YoY)",
      series: "INDPRO",
      transform: "yoy_pct",
      unit: "%",
      calm: 3,
      alarm: -10,
      weight: 10,
      threshold: 0,
      explanation:
        "We use industrial production YoY as a free, non-licensed proxy for the ISM Manufacturing PMI. A negative print typically aligns with a manufacturing recession.",
      formula: "value = (INDPRO_t / INDPRO_{t-12} - 1) × 100",
      source: "FRED: INDPRO",
    },
    {
      id: "lei",
      label: "OECD leading indicator",
      series: "USALOLITOAASTSAM",
      transform: "level",
      unit: "",
      calm: 101,
      alarm: 95,
      weight: 10,
      threshold: 100,
      explanation:
        "OECD Composite Leading Indicator (amplitude-adjusted) for the US. Below 100 is below trend. Replaced the discontinued Philly Fed state-leading index in v1.1.",
      formula: "score = lerp(value, calm=101 → 0, alarm=95 → 100)",
      source: "FRED (OECD-mirrored): USALOLITOAASTSAM",
    },
    {
      id: "unemployment",
      label: "Unemployment (YoY change)",
      series: "UNRATE",
      transform: "yoy_pp",
      unit: "pp",
      calm: -0.3,
      alarm: 1.0,
      weight: 10,
      threshold: 0.5,
      explanation:
        "Year-over-year change in the unemployment rate. A sustained rise of more than half a percentage point is rare outside of recessions.",
      formula: "value = UNRATE_t − UNRATE_{t-12}",
      source: "FRED: UNRATE",
    },
    {
      id: "gdp",
      label: "Real GDP (YoY)",
      series: "GDPC1",
      transform: "yoy_pct",
      unit: "%",
      calm: 3,
      alarm: -1.5,
      weight: 5,
      threshold: 0,
      explanation:
        "Real GDP year-over-year. The most direct (but lagging) measure of economic contraction.",
      formula: "value = (GDPC1_t / GDPC1_{t-4q} - 1) × 100",
      source: "FRED: GDPC1",
    },
    {
      id: "sentiment",
      label: "Consumer sentiment",
      series: "UMCSENT",
      transform: "level",
      unit: "",
      calm: 95,
      alarm: 60,
      weight: 5,
      threshold: 70,
      explanation:
        "University of Michigan consumer sentiment index. Sub-70 readings have historically clustered around recessions.",
      formula: "score = lerp(value, calm=95 → 0, alarm=60 → 100)",
      source: "FRED: UMCSENT",
    },
  ],
};

const EU: RegionConfig = {
  id: "eu",
  label: "Eurozone",
  short: "EU",
  bandsLabel: "CEPR-dated recessions",
  indicators: [
    {
      id: "yield_curve",
      label: "DE yield curve (10y–2y)",
      series: "IRLTLT01DEM156N",
      transform: "level",
      unit: "pp",
      calm: 1.0,
      alarm: -1.0,
      weight: 25,
      threshold: 0,
      explanation:
        "The gap between 10-year and 2-year German Bund yields, the eurozone's safe-asset curve.",
      formula: "score = lerp(value, calm=+1.0pp → 0, alarm=-1.0pp → 100)",
      source: "FRED (ECB-mirrored): IRLTLT01DEM156N − IR3TIB01DEM156N",
    },
    {
      id: "unemployment",
      label: "Unemployment (YoY change, DE/FR/IT/ES avg)",
      series: "LRHUTTTTDEM156S",
      transform: "yoy_pp",
      unit: "pp",
      calm: -0.5,
      alarm: 1.0,
      weight: 25,
      threshold: 0.5,
      explanation: "Eurozone harmonised unemployment is no longer a live FRED series, so we synthesise it as the equal-weight average of the rates for Germany, France, Italy and Spain — together ~75% of euro-area population. Reported as the year-over-year change.",
      formula: "value = mean(UR_DE, UR_FR, UR_IT, UR_ES)_t − mean(...)_{t-12}",
      source: "FRED (OECD-mirrored): LRHUTTTTDEM156S + FRM156S + ITM156S + ESM156S",
    },
    {
      id: "cli",
      label: "OECD leading indicator (DE/FR/IT avg)",
      series: "DEULOLITOAASTSAM",
      transform: "level",
      unit: "",
      calm: 101,
      alarm: 95,
      weight: 20,
      threshold: 100,
      explanation:
        "Eurozone CLI is no longer published as a single series, so we synthesise it as the equal-weight average of the OECD CLIs for Germany, France and Italy — the three largest eurozone economies.",
      formula:
        "value = mean(DEULOLITOAASTSAM, FRALOLITOAASTSAM, ITALOLITOAASTSAM)",
      source: "FRED (OECD-mirrored): DEULOLITOAASTSAM + FRALOLITOAASTSAM + ITALOLITOAASTSAM",
    },
    {
      id: "gdp",
      label: "Real GDP (YoY)",
      series: "CLVMNACSCAB1GQEA19",
      transform: "yoy_pct",
      unit: "%",
      calm: 2.5,
      alarm: -1.5,
      weight: 12,
      threshold: 0,
      explanation:
        "Eurozone real GDP, year-over-year — chain-linked volume measure.",
      formula: "value = (GDP_t / GDP_{t-4q} - 1) × 100",
      source: "FRED (Eurostat-mirrored): CLVMNACSCAB1GQEA19",
    },
    {
      id: "sentiment",
      label: "Consumer confidence",
      series: "CSCICP02EZM460S",
      transform: "level",
      unit: "",
      calm: -8,
      alarm: -25,
      weight: 13,
      threshold: -15,
      explanation:
        "OECD consumer confidence indicator for the eurozone (balance of opinion, 0-centred). Deeply negative readings cluster around recessions.",
      formula: "score = lerp(value, calm=-8 → 0, alarm=-25 → 100)",
      source: "FRED (OECD-mirrored): CSCICP02EZM460S",
    },
    {
      id: "cpi",
      label: "HICP (YoY)",
      series: "CP0000EZ19M086NEST",
      transform: "yoy_pct",
      unit: "%",
      calm: 2.0,
      alarm: 8.0,
      weight: 5,
      threshold: 4,
      explanation:
        "Eurozone harmonised CPI, year-over-year. Inflation shocks tighten policy and can pull the economy into recession.",
      formula: "value = (HICP_t / HICP_{t-12} - 1) × 100",
      source: "FRED (Eurostat-mirrored): CP0000EZ19M086NEST",
    },
  ],
};

const UK: RegionConfig = {
  id: "uk",
  label: "United Kingdom",
  short: "UK",
  bandsLabel: "ONS-dated recessions",
  indicators: [
    {
      id: "yield_curve",
      label: "UK gilt curve (10y–2y)",
      series: "IRLTLT01GBM156N",
      transform: "level",
      unit: "pp",
      calm: 1.0,
      alarm: -1.0,
      weight: 25,
      threshold: 0,
      explanation:
        "The gap between 10-year and 2-year UK gilt yields. Inversion is a long-standing recession signal here too.",
      formula: "score = lerp(value, calm=+1.0pp → 0, alarm=-1.0pp → 100)",
      source: "FRED (BoE-mirrored): IRLTLT01GBM156N − IR3TIB01GBM156N",
    },
    {
      id: "unemployment",
      label: "Unemployment (YoY change)",
      series: "LRHUTTTTGBM156S",
      transform: "yoy_pp",
      unit: "pp",
      calm: -0.5,
      alarm: 1.0,
      weight: 25,
      threshold: 0.5,
      explanation: "ONS LFS unemployment rate, year-over-year change.",
      formula: "value = UR_t − UR_{t-12}",
      source: "FRED (ONS-mirrored): LRHUTTTTGBM156S",
    },
    {
      id: "cli",
      label: "OECD leading indicator",
      series: "GBRLOLITOAASTSAM",
      transform: "level",
      unit: "",
      calm: 101,
      alarm: 95,
      weight: 20,
      threshold: 100,
      explanation:
        "OECD Composite Leading Indicator (amplitude-adjusted) for the UK. Below 100 is below trend.",
      formula: "score = lerp(value, calm=101 → 0, alarm=95 → 100)",
      source: "FRED (OECD-mirrored): GBRLOLITOAASTSAM",
    },
    {
      id: "gdp",
      label: "Real GDP (YoY)",
      series: "NGDPRSAXDCGBQ",
      transform: "yoy_pct",
      unit: "%",
      calm: 2.5,
      alarm: -1.5,
      weight: 12,
      threshold: 0,
      explanation: "UK real GDP, year-over-year. Replaced the discontinued Eurostat mirror in v1.2 with the IMF NGDP series, which stays current.",
      formula: "value = (GDP_t / GDP_{t-4q} - 1) × 100",
      source: "FRED (IMF IFS-mirrored): NGDPRSAXDCGBQ",
    },
    {
      id: "sentiment",
      label: "Consumer confidence",
      series: "CSCICP02GBM460S",
      transform: "level",
      unit: "",
      calm: -8,
      alarm: -25,
      weight: 13,
      threshold: -15,
      explanation:
        "OECD consumer confidence indicator for the UK (balance of opinion, 0-centred). Deeply negative readings cluster around recessions.",
      formula: "score = lerp(value, calm=-8 → 0, alarm=-25 → 100)",
      source: "FRED (OECD-mirrored): CSCICP02GBM460S",
    },
    {
      id: "bank_rate",
      label: "UK overnight rate (12m change)",
      series: "IUDSOIA",
      transform: "diff_3m_pp",
      unit: "pp",
      calm: 0,
      alarm: 4,
      weight: 5,
      threshold: 2,
      explanation:
        "Sterling Overnight Index Average (SONIA), the BoE's main policy proxy in money markets. Sharp rises over a year have historically been followed by contractions. Replaced the long-discontinued INTGSTGBM193N in v1.2.",
      formula: "value = SONIA_t − SONIA_{t-12}",
      source: "FRED (BoE-mirrored): IUDSOIA",
    },
  ],
};

const GLOBAL: RegionConfig = {
  id: "global",
  label: "Global composite",
  short: "Global",
  bandsLabel: "OECD-dated global slowdowns",
  indicators: [
    {
      id: "us_score",
      label: "US sub-score",
      series: "DERIVED",
      transform: "level",
      unit: "",
      calm: 0,
      alarm: 100,
      weight: 35,
      threshold: 50,
      explanation:
        "The Recession Compass US composite, used as the US contribution to the global score.",
      formula: "value = compositeScore(US)",
      source: "Internal: composite(US)",
    },
    {
      id: "eu_score",
      label: "Eurozone sub-score",
      series: "DERIVED",
      transform: "level",
      unit: "",
      calm: 0,
      alarm: 100,
      weight: 30,
      threshold: 50,
      explanation:
        "The Recession Compass Eurozone composite, contribution to the global score.",
      formula: "value = compositeScore(EU)",
      source: "Internal: composite(EU)",
    },
    {
      id: "cn_cli",
      label: "China OECD leading indicator",
      series: "CHNLOLITOAASTSAM",
      transform: "level",
      unit: "",
      calm: 101,
      alarm: 95,
      weight: 20,
      threshold: 100,
      explanation:
        "OECD Composite Leading Indicator (amplitude-adjusted) for China — the cleanest free signal of the world's second-largest economy's growth trajectory.",
      formula: "score = lerp(value, calm=101 → 0, alarm=95 → 100)",
      source: "FRED (OECD-mirrored): CHNLOLITOAASTSAM",
    },
    {
      id: "jp_cli",
      label: "Japan OECD leading indicator",
      series: "JPNLOLITOAASTSAM",
      transform: "level",
      unit: "",
      calm: 101,
      alarm: 95,
      weight: 15,
      threshold: 100,
      explanation:
        "OECD Composite Leading Indicator (amplitude-adjusted) for Japan — included for diversification and as an early warning on East Asian trade.",
      formula: "score = lerp(value, calm=101 → 0, alarm=95 → 100)",
      source: "FRED (OECD-mirrored): JPNLOLITOAASTSAM",
    },
  ],
};

export const REGION_CONFIGS: Record<RegionId, RegionConfig> = {
  us: US,
  eu: EU,
  uk: UK,
  global: GLOBAL,
};

export const REGION_ORDER: RegionId[] = ["us", "eu", "uk", "global"];

export function regionConfig(id: RegionId): RegionConfig {
  return REGION_CONFIGS[id];
}
