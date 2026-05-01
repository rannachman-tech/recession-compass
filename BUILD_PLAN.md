# Recession Compass — Build Plan

## What this is

A free, retail-facing barometer that answers "is a recession coming?" for four regions:

| Route | Region | Data sources |
|---|---|---|
| `/` | United States | FRED |
| `/europe` | Eurozone | FRED (ECB / Eurostat / OECD series mirrored on FRED) |
| `/uk` | United Kingdom | FRED (ONS / BoE / OECD series mirrored on FRED) |
| `/global` | Global composite | FRED (US 35% / EU 30% / CN 20% / JP 15%) |
| `/methodology` | Shared methodology + changelog | — |
| `/about` | Privacy + disclaimer | — |

The hero of every page is a hand-built SVG barometer. Below it, 6–8 small gauges per indicator. Below that, one deep history chart with NBER (or equivalent) recession bands.

## Stack — locked in

- **Framework**: Next.js 14 App Router + TypeScript + Tailwind
- **Data**: Public FRED time series, fetched server-side via GitHub Actions cron, committed to `data/recession-{region}.json`. Pages read at build time (Pattern A).
- **Cron cadence**: Every 6 hours (recession data updates slowly — daily/weekly/monthly series only).
- **Hosting (preview)**: Vercel Hobby — auto-deploys on push.
- **Hosting (production)**: Coolify on eToro infra at `*.etoro.com` (later — out of scope this session).
- **Persistence**: localStorage for prefs only (theme, Plain English / Pro toggle, last region viewed).
- **AI**: none. Composite math is fully deterministic and lives on the methodology page.

## Why all-FRED for v1

The brief calls for ECB SDW + Eurostat (EU), ONS + BoE (UK), and a global composite. **In v1 we use FRED as the single fetcher.** FRED mirrors:

- Yield curves for DE, GB, JP, etc.
- Unemployment for every OECD country
- OECD Composite Leading Indicators (CLI)
- HICP / CPI for every member state

This keeps the cron simple (one API key, one rate limit, one error path) and lets us ship four working regions today. The methodology page is upfront about which series we use. v2 can swap in native ECB SDW / Eurostat / ONS / BoE adapters if Compliance prefers original-source citations — the adapter pattern in `scripts/` is built for that swap.

## Composite formula

```
score = clamp(0, 100, Σ(weight_i * indicator_score_i))
```

Each indicator is normalised to a 0-100 sub-score using region-appropriate thresholds (defined in `lib/regions.ts`). Default weights — sum to 100 — for the US:

| Indicator | Weight | Threshold |
|---|---|---|
| Yield curve (T10Y2Y) | 25 | inverted < 0 → high |
| Sahm rule | 25 | ≥ 0.50 → recession signal |
| Initial claims (4w MA YoY) | 10 | > +20% → high |
| ISM PMI proxy (INDPRO YoY) | 10 | < 0% → high |
| Leading Index (USSLIND or OECD CLI) | 10 | < 99.5 → high |
| Unemployment YoY change | 10 | > +0.5pp → high |
| Real GDP YoY | 5 | < 0% → high |
| Consumer sentiment (UMCSENT) | 5 | < 70 → high |

Each region defines its own threshold and indicator set in `lib/regions.ts`. The methodology page renders all four tables.

## Confidence band

We compute a ±band as 1.5 × stdev of the per-indicator sub-scores. A wide band = indicators disagree → less confidence. A narrow band = indicators agree → more confidence. Shown as faint shading on either side of the needle.

## Interpretation strings

| Score range | Banner copy |
|---|---|
| 0–30 | "Skies are clear." |
| 30–60 | "Storm watch." |
| 60–80 | "Storm warning." |
| 80+ | "Storm in progress." |

## File tree

```
recession-compass/
├── app/
│   ├── globals.css
│   ├── layout.tsx                 # theme bootstrap, header, footer
│   ├── page.tsx                   # US (default)
│   ├── europe/page.tsx
│   ├── uk/page.tsx
│   ├── global/page.tsx
│   ├── methodology/page.tsx
│   └── about/page.tsx
├── components/
│   ├── Barometer.tsx              # hand-built SVG hero (no Recharts)
│   ├── GaugePanel.tsx             # 6-8 small gauges
│   ├── Gauge.tsx                  # one indicator gauge
│   ├── DeepChart.tsx              # 50yr composite with NBER bands (recharts ok here)
│   ├── RegionTabs.tsx             # /, /europe, /uk, /global tab switcher
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ThemeToggle.tsx
│   ├── ProToggle.tsx              # Plain English / Pro mode
│   ├── LiveSourcesRow.tsx         # "FRED ✓"
│   ├── RiskBanner.tsx             # top compliance banner
│   └── ConnectEtoroCta.tsx        # header + contextual CTA
├── lib/
│   ├── types.ts                   # RegionData, Indicator, etc.
│   ├── regions.ts                 # region configs (indicators, weights, thresholds)
│   ├── composite.ts               # composite-score math
│   ├── fred.ts                    # FRED API client
│   ├── nber.ts                    # NBER recession bands (static, hand-coded list)
│   ├── interpret.ts               # score → banner copy
│   ├── storage.ts                 # localStorage prefs
│   └── format.ts                  # number/date formatters
├── data/
│   ├── recession-us.json
│   ├── recession-eu.json
│   ├── recession-uk.json
│   └── recession-global.json
├── scripts/
│   ├── fetch-region.ts            # generic FRED-to-region fetcher
│   └── run.ts                     # orchestrator (calls all 4 regions)
├── public/
├── .github/workflows/update-data.yml
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
├── .gitignore
├── .env.local.example
├── README.md
├── BUILD_PLAN.md                  # this file
└── DEPLOYMENT.md
```

## Free-tier headroom

| Service | Limit | Recession Compass usage |
|---|---|---|
| FRED API | 120 req/min, no daily cap | ~32 req per cron run (8 series × 4 regions). 4 runs/day = ~128 req/day. |
| GitHub Actions (public) | unlimited | ~30 min/month for 6h cron |
| GitHub Actions (private free) | 2,000 min/mo | ~30 min/mo. Plenty. |
| Vercel Hobby bandwidth | 100 GB/mo | <1 GB at 10k DAU (data is tiny JSON). |
| Vercel Hobby deploys | 100/day | 4/day from cron. |

Headroom is huge across the board. No paid services needed.

## Risks / open decisions

1. **Some FRED series are revised**. Sahm in particular has a real-time variant (`SAHMREALTIME`) and a current variant (`SAHMCURRENT`). We use the real-time series so the score isn't reshaped by hindsight revisions. Documented on methodology.
2. **Confidence band** is a heuristic, not a statistical confidence interval. Methodology page says so explicitly.
3. **NBER bands** are US-specific. For EU/UK/Global we use CEPR (Euro area), ONS-declared (UK), and skip bands on Global. Methodology says so.
4. **ISM PMI proxy**: real ISM data is licensed. We use INDPRO YoY as a documented proxy. Open whether to swap to S&P Global PMI mirrored on FRED later.
5. **CTA target**: the "Connect eToro" link needs a real defensive-ETF basket URL. Placeholder for now: `https://www.etoro.com/discover/markets/etfs`. Replace before launch.

## Build sequence

1. Scaffold project + theme + security headers + disclaimer footer
2. Build `Barometer` (hero — gets disproportionate care)
3. Build `Gauge` + `GaugePanel`
4. Build `DeepChart`
5. Build region pages + `RegionTabs`
6. Build `/methodology` and `/about`
7. Build `lib/regions.ts` + `lib/composite.ts`
8. Build `scripts/fetch-region.ts` + seed data
9. Wire GitHub Actions
10. Verify (`tsc --noEmit` + `next build`)
11. README + DEPLOYMENT
