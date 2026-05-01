import type { RegionId } from "./types";

/**
 * Per-region indicator definitions.
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
      alarm: 0.8,
      weight: 25,
      threshold: 0.5,
      explanation:
        "Triggers when the 3-month average unemployment rate is 0.5pp above its 12-month low. Fires near the start of every US recession since 1970.",
      formula: "score = lerp(value, calm=0.0pp → 0, alarm=0.8pp → 100)",
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
      calm: 4,
      alarm: -4,
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
      calm: 100.5,
      alarm: 98.5,
      weight: 10,
      threshold: 100,
      explanation:
        "OECD Composite Leading Indicator (amplitude-adjusted) for the US. Below 100 is below trend. Replaced the discontinued Philly Fed state-leading index in v1.1.",
      formula: "score = lerp(value, calm=100.5 → 0, alarm=98.5 → 100)",
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
      label: "Unemployment (YoY change)",
      series: "LRHUTTTTEZM156S",
      transform: "yoy_pp",
      unit: "pp",
      calm: -0.5,
      alarm: 1.0,
      weight: 20,
      threshold: 0.5,
      explanation: "Eurostat harmonised unemployment rate, year-over-year change.",
      formula: "value = UR_t − UR_{t-12}",
      source: "FRED (Eurostat-mirrored): LRHUTTTTEZM156S",
    },
    {
      id: "ip",
      label: "Industrial production (YoY)",
      series: "EA19PRINTO01GYSAM",
      transform: "yoy_pct",
      unit: "%",
      calm: 3,
      alarm: -5,
      weight: 15,
      threshold: 0,
      explanation:
        "Eurozone industrial production, year-over-year. A reliable warning bell in manufacturing-heavy economies.",
      formula: "value = (IP_t / IP_{t-12} - 1) × 100",
      source: "FRED (Eurostat-mirrored): EA19PRINTO01GYSAM",
    },
    {
      id: "cli",
      label: "OECD leading indicator (DE/FR/IT avg)",
      series: "DEULOLITOAASTSAM",
      transform: "level",
      unit: "",
      calm: 100.5,
      alarm: 98.5,
      weight: 15,
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
      weight: 10,
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
      weight: 10,
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
      weight: 20,
      threshold: 0.5,
      explanation: "ONS LFS unemployment rate, year-over-year change.",
      formula: "value = UR_t − UR_{t-12}",
      source: "FRED (ONS-mirrored): LRHUTTTTGBM156S",
    },
    {
      id: "ip",
      label: "Industrial production (YoY)",
      series: "GBRPROINDMISMEI",
      transform: "yoy_pct",
      unit: "%",
      calm: 2,
      alarm: -5,
      weight: 15,
      threshold: 0,
      explanation:
        "UK industrial production, year-over-year. Stands in for PMI Manufacturing.",
      formula: "value = (IP_t / IP_{t-12} - 1) × 100",
      source: "FRED (ONS-mirrored): GBRPROINDMISMEI",
    },
    {
      id: "cli",
      label: "OECD leading indicator",
      series: "GBRLOLITOAASTSAM",
      transform: "level",
      unit: "",
      calm: 100.5,
      alarm: 98.5,
      weight: 15,
      threshold: 100,
      explanation:
        "OECD Composite Leading Indicator (amplitude-adjusted) for the UK. Below 100 is below trend.",
      formula: "score = lerp(value, calm=100.5 → 0, alarm=98.5 → 100)",
      source: "FRED (OECD-mirrored): GBRLOLITOAASTSAM",
    },
    {
      id: "gdp",
      label: "Real GDP (YoY)",
      series: "CLVMNACSCAB1GQUK",
      transform: "yoy_pct",
      unit: "%",
      calm: 2.5,
      alarm: -1.5,
      weight: 10,
      threshold: 0,
      explanation: "UK real GDP, year-over-year.",
      formula: "value = (GDP_t / GDP_{t-4q} - 1) × 100",
      source: "FRED (Eurostat-mirrored): CLVMNACSCAB1GQUK",
    },
    {
      id: "sentiment",
      label: "Consumer confidence",
      series: "CSCICP02GBM460S",
      transform: "level",
      unit: "",
      calm: -8,
      alarm: -25,
      weight: 10,
      threshold: -15,
      explanation:
        "OECD consumer confidence indicator for the UK (balance of opinion, 0-centred). Deeply negative readings cluster around recessions.",
      formula: "score = lerp(value, calm=-8 → 0, alarm=-25 → 100)",
      source: "FRED (OECD-mirrored): CSCICP02GBM460S",
    },
    {
      id: "bank_rate",
      label: "BoE Bank Rate (12m change)",
      series: "INTGSTGBM193N",
      transform: "diff_3m_pp",
      unit: "pp",
      calm: 0,
      alarm: 4,
      weight: 5,
      threshold: 2,
      explanation:
        "Speed of monetary tightening. Sharp rises in Bank Rate over a year have historically been followed by contractions.",
      formula: "value = BankRate_t − BankRate_{t-12}",
      source: "FRED (BoE-mirrored): INTGSTGBM193N",
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
      calm: 100.5,
      alarm: 98,
      weight: 20,
      threshold: 100,
      explanation:
        "OECD Composite Leading Indicator (amplitude-adjusted) for China — the cleanest free signal of the world's second-largest economy's growth trajectory.",
      formula: "score = lerp(value, calm=100.5 → 0, alarm=98 → 100)",
      source: "FRED (OECD-mirrored): CHNLOLITOAASTSAM",
    },
    {
      id: "jp_cli",
      label: "Japan OECD leading indicator",
      series: "JPNLOLITOAASTSAM",
      transform: "level",
      unit: "",
      calm: 100.5,
      alarm: 98,
      weight: 15,
      threshold: 100,
      explanation:
        "OECD Composite Leading Indicator (amplitude-adjusted) for Japan — included for diversification and as an early warning on East Asian trade.",
      formula: "score = lerp(value, calm=100.5 → 0, alarm=98 → 100)",
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
