# Recession Compass

A free, transparent, retail-facing barometer that turns a small set of public economic indicators into a single 0–100 recession-probability score. Built for the eToro app store.

Live regions: **United States · Eurozone · United Kingdom · Global composite.**

The hero is a hand-built SVG barometer — needle, confidence band, weather palette, weighted easing. Everything below it (the gauges, the 50-year history chart with recession bands, the methodology page) is in service of explaining where the needle points and why.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind 3** with editorial-modernism design tokens
- **Recharts** for the deep history chart only — the barometer and gauges are hand-built SVG
- **No database, no analytics, no cookies.** localStorage prefs only (theme, Plain / Pro mode).
- **Static-first**: the cron commits JSON, Vercel auto-deploys.

## Free-tier headroom

| Service | Limit | Recession Compass usage |
|---|---|---|
| FRED API | 120 req/min, no daily cap | ~32 req per cron run, 4 runs/day = ~128/day. Headroom: huge. |
| GitHub Actions (public repo) | unlimited | ~30 min/month for 6h cron |
| GitHub Actions (private free) | 2,000 min/mo | ~30 min/mo. Headroom: huge. |
| Vercel Hobby bandwidth | 100 GB/mo | <1 GB at 10k DAU (data is tiny JSON). |
| Vercel Hobby deploys | 100/day | 4/day from cron. Headroom: huge. |

If you're within 25% of any ceiling, redesign before adding usage. Cost target: $0/month forever.

## File tree (the bits that matter)

```
recession-compass/
├── app/
│   ├── page.tsx              # / → United States
│   ├── europe/page.tsx       # /europe → Eurozone
│   ├── uk/page.tsx           # /uk → United Kingdom
│   ├── global/page.tsx       # /global → Composite
│   ├── methodology/page.tsx  # formulas, weights, sources, changelog
│   └── about/page.tsx        # privacy + disclaimer
├── components/
│   ├── Barometer.tsx         # hand-built SVG centerpiece
│   ├── Gauge.tsx             # one indicator gauge
│   ├── GaugePanel.tsx        # 6–8 gauges + Plain/Pro toggle
│   ├── DeepChart.tsx         # 50-year composite + recession bands
│   ├── RegionView.tsx        # ties everything together
│   ├── RegionTabs.tsx        # /, /europe, /uk, /global tab switcher
│   ├── RiskBanner.tsx        # top compliance banner
│   ├── ConnectEtoroCta.tsx   # header + contextual CTA
│   ├── Header.tsx, Footer.tsx, ThemeToggle.tsx, ProToggle.tsx, LiveSourcesRow.tsx
├── lib/
│   ├── regions.ts            # per-region indicator config (the brain)
│   ├── composite.ts          # weighted-average composite + confidence band
│   ├── fred.ts               # tiny FRED API client
│   ├── nber.ts               # recession bands per region
│   ├── interpret.ts          # score → "Skies are clear." etc.
│   └── storage.ts, types.ts, format.ts
├── data/                     # cron output — committed JSON
│   ├── recession-us.json
│   ├── recession-eu.json
│   ├── recession-uk.json
│   └── recession-global.json
├── scripts/
│   ├── fetch-region.ts       # FRED → composite for one region
│   └── run.ts                # orchestrator
└── .github/workflows/update-data.yml
```

## Local development

You need Node 20+ and a free FRED API key.

```bash
# 1. Get your FRED key (free, instant):
#    https://fred.stlouisfed.org/docs/api/api_key.html

# 2. Set it locally:
cp .env.local.example .env.local
# edit .env.local and put your key in

# 3. Install + run
npm install
npm run dev          # http://localhost:3000

# 4. Refresh data manually whenever you want:
npm run fetch              # all four regions
npm run fetch:us           # one region
npm run fetch:global       # composite (depends on us+eu output)
```

## Deployment to Vercel (preview)

1. Push this repo to GitHub.
2. Import it into Vercel — no config, just defaults.
3. In **Vercel → Project Settings → Environment Variables**, add `FRED_API_KEY` for *Production* and *Preview*.
4. In **GitHub → Repo Settings → Secrets and variables → Actions**, add the same `FRED_API_KEY` so the cron can run.
5. The cron commits to `data/`, the commit triggers Vercel auto-deploy. No further wiring needed.

## Migrating to Coolify (production at `*.etoro.com`)

See `DEPLOYMENT.md` for the handoff doc to give the eToro infra owner. The short version: same Dockerfile, one web app + one scheduled task, both backed by a shared `/app/data` volume.

## Compliance notes for the eToro app store

- **Disclaimer footer** on every page (component: `Footer.tsx`). Wording matches the methodology page and About page.
- **About page** at `/about` covers privacy, sources, disclaimer.
- **No tracking, no analytics, no cookies, no third-party scripts.** Preferences in localStorage only.
- **Security headers** configured in `next.config.js`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS.
- **Connect eToro CTA** uses a placeholder URL pointing to the ETF discovery page. Replace with the defensive-basket page URL before launch (one place: `components/ConnectEtoroCta.tsx`).

## What this score is *not*

It is not a forecast model trained on recessions, not a Bayesian probability, and not financial advice. It is a calibrated severity index that reads a set of public indicators on a common 0–100 scale. The methodology page lists every formula and source.

## License

MIT. Data is owned by FRED and the underlying publishers; we just summarise.
