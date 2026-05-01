import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Recession Compass is, how it works, sources, privacy posture, and the disclaimer.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Link
        href="/"
        className="focus-ring inline-flex items-center text-[12px] text-fg-muted hover:text-fg"
      >
        ← Back
      </Link>

      <h1 className="mt-4 text-[34px] sm:text-[42px] font-semibold tracking-tight text-fg">
        About Recession Compass
      </h1>

      <div className="mt-6 space-y-8 text-[15px] leading-relaxed text-fg-muted">
        <Section title="What this is">
          <p>
            Recession Compass is a free, single-page barometer that turns a
            small set of public economic indicators into a 0–100 score for the
            US, eurozone, UK and a global composite. The hero is a hand-built
            dial; every contributing indicator is shown below with a
            plain-English explanation and a Pro mode that exposes the raw
            value and formula.
          </p>
        </Section>

        <Section title="How it works">
          <p>
            A scheduled job runs every 6 hours. It fetches the latest
            observations for each indicator from{" "}
            <a
              href="https://fred.stlouisfed.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              FRED
            </a>
            , normalises each to a 0–100 sub-score using calibrated calm/alarm
            anchors, and combines them into a weighted composite. The result
            is committed as a static JSON file; the page reads it at build
            time. The full methodology and per-region formulas are available
            on request to the eToro app store team.
          </p>
        </Section>

        <Section title="Privacy">
          <p>
            No accounts, no analytics, no third-party trackers, no cookies.
            Theme and reading-depth preferences are stored in your browser's
            localStorage and never leave your device. There is no backend that
            knows you visited.
          </p>
        </Section>

        <Section title="Sources">
          <p>
            All raw series are pulled from FRED (Federal Reserve Bank of St.
            Louis), which mirrors data from the ECB, Eurostat, OECD, ONS, BoE
            and the BLS. The methodology document (available on request) lists
            every series id used per region.
          </p>
        </Section>

        <Section title="Limits">
          <p>
            The composite is a calibrated severity index, not a Bayesian
            probability or a trained forecast. It will sometimes peg high
            during slowdowns that do not become officially-dated recessions,
            and vice-versa. Treat it as a quick read, not a verdict.
          </p>
        </Section>

        <Section title="Disclaimer">
          <p>
            For informational purposes only. Recession Compass aggregates
            publicly available economic time series from third-party
            publishers (FRED — Federal Reserve Bank of St. Louis) and is not
            affiliated with them. Nothing on this site constitutes financial,
            investment, legal, or tax advice. Capital at risk; past
            performance is not an indication of future results.
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
        {title}
      </h2>
      {children}
    </section>
  );
}
