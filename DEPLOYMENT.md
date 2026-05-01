# Deployment

## Stage 1 — Vercel preview (today)

1. Push the repo to GitHub.
2. Connect to Vercel: New Project → Import Git Repository → pick the repo → Deploy.
3. Add `FRED_API_KEY` to Vercel env vars (Production + Preview).
4. Add `FRED_API_KEY` to GitHub repo secrets so the cron can run.
5. The first cron fires within 0–2 hours (brand-new private repos can take longer — see gotcha below). You can also trigger it manually from the Actions tab.

The committed JSON in `data/` is the seed — Vercel renders the page even before the first cron run.

## Stage 2 — Coolify production at `*.etoro.com`

When the eToro app store team is ready to host this in production, hand them this section.

### What we need

- **One application**: the Next.js web app, built from the Dockerfile (or just `npm run build && npm start` if Coolify autodetects).
- **One scheduled task**: same image, but with command `npm run fetch`, schedule `0 */6 * * *`.
- **One persistent volume**: mounted at `/app/data` on both. The cron writes JSON, the web reads it.
- **Domain**: `recession-compass.etoro.com` (or whatever the app store team prefers).
- **Env var**: `FRED_API_KEY` on the scheduled task. Optional `NEXT_PUBLIC_SITE_URL` on the web for accurate metadata `metadataBase`.

### Resource sizing

| Service | Memory | CPU |
|---|---|---|
| Web app | 256 MB | 0.25 vCPU |
| Scheduled task | 512 MB | 0.25 vCPU |

The cron is light — only ~32 HTTP requests to FRED, no LLM. Web is static read-from-volume.

### Switching the web app to Pattern B

The codebase currently uses Pattern A (Vercel-style: `import data from "@/data/...json"`). For Coolify with a shared volume, we need to switch to Pattern B (runtime read from volume).

In each `app/*/page.tsx`, change:

```ts
import data from "@/data/recession-us.json";
// ...
export default function USPage() {
  return <RegionView data={data as RegionData} />;
}
```

…to:

```ts
import { readFile } from "fs/promises";
import path from "path";
export const dynamic = "force-dynamic";

export default async function USPage() {
  const raw = await readFile(path.join("/app/data", "recession-us.json"), "utf8");
  const data = JSON.parse(raw) as RegionData;
  return <RegionView data={data} />;
}
```

Apply the same change to `/europe`, `/uk`, `/global`. The seed JSON in the repo can stay as a fallback for the first boot.

### Cutover plan

1. Stand up Coolify web + scheduled task pointed at the GitHub repo.
2. Verify the first manual `npm run fetch` writes to the volume and the web app picks it up.
3. Once steady-state, edit `.github/workflows/update-data.yml` to remove the `schedule:` block, leaving only `workflow_dispatch:` as a manual fallback.
4. Update DNS to the Coolify domain.
5. Archive the Vercel project (don't delete — useful as a fallback).

## Gotchas (real, observed on Daily Digest)

See `BUILD_PLAN.md` for the full list. The two most likely to bite this app:

- **Brand-new private repo cron lag.** First scheduled run can take 30–120 minutes. If after 2 hours it hasn't fired, check Actions tab → workflow → look for "This workflow has been disabled" banner. Click **Enable**. Then check Settings → Actions → General → "Allow all actions" + "Read and write permissions."
- **GitHub Actions cron is best-effort.** `*/6` can become 8–10h gaps under load. If reliability matters, switch to Coolify (Stage 2).

## Submission checklist (eToro app store)

- [ ] Disclaimer footer on every page — wording matches across footer / About / submission form.
- [ ] About page exists at `/about`, linked from header and footer.
- [ ] Methodology page exists at `/methodology` with formulas, weights, sources, changelog.
- [ ] No analytics, no third-party scripts, no cookies.
- [ ] Security headers configured in `next.config.js`.
- [ ] All external links use `target="_blank" rel="noopener noreferrer"`.
- [ ] Real screenshots taken from a live deploy (3 desktop, 3 mobile, light + dark mix).
- [ ] App icon at requested sizes (192×192, 512×512).
- [ ] `Connect eToro` CTA URL replaced with the agreed defensive-ETF basket page (one edit, in `components/ConnectEtoroCta.tsx`).
