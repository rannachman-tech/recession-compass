import Link from "next/link";
import type { Metadata } from "next";
import { REGION_ORDER, regionConfig } from "@/lib/regions";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "Formulas, weights, sources and changelog for the Recession Compass composite score.",
};

const CHANGELOG: Array<{ date: string; change: string }> = [
  {
    date: "2026-05-01",
    change:
      "Initial public release. US (FRED), Europe (FRED-mirrored ECB/Eurostat/OECD), UK (FRED-mirrored ONS/BoE/OECD), Global composite (US 35 / EU 30 / CN 20 / JP 15).",
  },
];

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Link
        href="/"
        className="focus-ring inline-flex items-center text-[12px] text-fg-muted hover:text-fg"
      >
        ← Back
      </Link>

      <h1 className="mt-4 text-[34px] sm:text-[42px] font-semibold tracking-tight text-fg">
        Methodology
      </h1>
      <p className="mt-3 text-[15px] text-fg-muted">
        Recession Compass turns a small number of public economic indicators
        into a single 0–100 score. Everything that goes into that score is
        listed below — same input, same output, no black boxes.
      </p>

      <Section title="The composite score">
        <p>
          For each region we take 4–8 indicators, normalise each to a 0–100
          sub-score (using calibrated calm/alarm anchors), then take a weighted
          average. The result is rounded to the nearest integer.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-[12px] text-fg">
{`score = clamp(0, 100, Σ(weight_i × subScore_i) / Σ(weight_i))`}
        </pre>
      </Section>

      <Section title="Confidence band">
        <p>
          The faint band on either side of the needle is{" "}
          <code className="font-mono text-[12px]">1.5 × stdev</code> of the
          per-indicator sub-scores, capped at ±35. A wide band means the
          indicators disagree; a narrow band means they cluster. It is a
          heuristic, not a statistical confidence interval.
        </p>
      </Section>

      <Section title="Interpretation bands">
        <table className="mt-3 w-full overflow-hidden rounded-md border border-border text-[13px]">
          <thead className="bg-surface-2 text-[11px] font-mono uppercase tracking-wider text-fg-subtle">
            <tr>
              <th className="px-3 py-2 text-left">Score</th>
              <th className="px-3 py-2 text-left">Banner copy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <Row a="0–30" b="Skies are clear." />
            <Row a="30–60" b="Storm watch." />
            <Row a="60–80" b="Storm warning." />
            <Row a="80+" b="Storm in progress." />
          </tbody>
        </table>
      </Section>

      {REGION_ORDER.map((id) => {
        const cfg = regionConfig(id);
        const totalWeight = cfg.indicators.reduce((s, i) => s + i.weight, 0);
        return (
          <Section key={id} title={`${cfg.label} — indicators & weights`}>
            <p className="mb-3">
              Total weight: <strong>{totalWeight}</strong> (we forgive any
              minor over/under by normalising to the actual sum).
            </p>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-[12px]">
                <thead className="bg-surface-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  <tr>
                    <th className="px-3 py-2 text-left">Indicator</th>
                    <th className="px-3 py-2 text-left">Weight</th>
                    <th className="px-3 py-2 text-left">Calm</th>
                    <th className="px-3 py-2 text-left">Alarm</th>
                    <th className="px-3 py-2 text-left">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cfg.indicators.map((ind) => (
                    <tr key={ind.id} className="align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium text-fg">{ind.label}</div>
                        <div className="mt-0.5 text-fg-muted">
                          {ind.explanation}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-fg">
                        {ind.weight}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-fg-muted">
                        {ind.calm}
                        {ind.unit}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-fg-muted">
                        {ind.alarm}
                        {ind.unit}
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-fg-subtle">
                        {ind.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        );
      })}

      <Section title="Sources">
        <p>
          All raw series are pulled from{" "}
          <a
            href="https://fred.stlouisfed.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            FRED
          </a>{" "}
          (Federal Reserve Bank of St. Louis), which mirrors data from the
          ECB, Eurostat, OECD, ONS, BoE and others. We use FRED as the single
          fetcher to keep the cron simple — see the README for the v2 plan to
          swap in native source adapters.
        </p>
      </Section>

      <Section title="Recession bands on the deep chart">
        <p>
          US: <strong>NBER</strong> business-cycle dating committee. Eurozone:{" "}
          <strong>CEPR</strong> EABCDC. UK: <strong>ONS</strong>-declared
          recessions. Global: an approximate set of OECD-dated global
          slowdowns; treat as illustrative.
        </p>
      </Section>

      <Section title="What this score is not">
        <ul className="ml-4 list-disc space-y-1.5">
          <li>It is not a forecast model trained on recessions.</li>
          <li>
            It is not a probability in the Bayesian sense — the 0–100 number
            is a calibrated severity index, not a likelihood estimate.
          </li>
          <li>It is not financial advice.</li>
          <li>
            It will sometimes peg high during a slowdown that does not become
            an official recession, and vice-versa.
          </li>
        </ul>
      </Section>

      <Section title="Changelog">
        <ul className="space-y-2">
          {CHANGELOG.map((c) => (
            <li key={c.date} className="flex gap-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-fg-subtle whitespace-nowrap">
                {c.date}
              </span>
              <span className="text-fg-muted">{c.change}</span>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed text-fg-muted">
        {children}
      </div>
    </section>
  );
}

function Row({ a, b }: { a: string; b: string }) {
  return (
    <tr>
      <td className="px-3 py-2 font-mono text-fg">{a}</td>
      <td className="px-3 py-2 text-fg-muted">{b}</td>
    </tr>
  );
}
