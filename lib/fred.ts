/**
 * Tiny FRED API client used by scripts/run.ts.
 * Free signup → https://fred.stlouisfed.org/docs/api/api_key.html
 *
 * Limits: 120 req/min, no daily cap. We pace at ~10 req/sec.
 */

export interface FredObservation {
  date: string; // YYYY-MM-DD
  value: number | null; // FRED returns "." for missing — we coerce to null
}

const BASE = "https://api.stlouisfed.org/fred";

function apiKey(): string {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    throw new Error(
      "FRED_API_KEY is not set. Get one at https://fred.stlouisfed.org/docs/api/api_key.html and put it in .env.local or as a GitHub Actions secret."
    );
  }
  return key;
}

export async function fetchSeries(
  seriesId: string,
  opts: { start?: string; end?: string } = {}
): Promise<FredObservation[]> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey(),
    file_type: "json",
    sort_order: "asc",
  });
  if (opts.start) params.set("observation_start", opts.start);
  if (opts.end) params.set("observation_end", opts.end);

  const url = `${BASE}/series/observations?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `FRED ${seriesId} → HTTP ${res.status}: ${body.slice(0, 200)}`
    );
  }
  const json = (await res.json()) as { observations: Array<{ date: string; value: string }> };
  return json.observations.map((o) => ({
    date: o.date,
    value: o.value === "." ? null : Number(o.value),
  }));
}

export function lastValid(obs: FredObservation[]): FredObservation | null {
  for (let i = obs.length - 1; i >= 0; i--) {
    if (obs[i].value !== null) return obs[i];
  }
  return null;
}

export function valueOnOrBefore(
  obs: FredObservation[],
  date: string
): FredObservation | null {
  for (let i = obs.length - 1; i >= 0; i--) {
    if (obs[i].date <= date && obs[i].value !== null) return obs[i];
  }
  return null;
}
