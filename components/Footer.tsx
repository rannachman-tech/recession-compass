import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface-2/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="mb-5 max-w-3xl text-[11px] leading-relaxed text-fg-subtle">
          For informational purposes only. Recession Compass aggregates
          publicly available economic time series from third-party publishers
          (FRED — Federal Reserve Bank of St. Louis) and is not affiliated
          with them. Nothing on this site constitutes financial, investment,
          legal, or tax advice. Capital at risk; past performance is not an
          indication of future results.
        </p>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <p className="text-[12px] text-fg-muted">
            <span className="font-semibold text-fg">Recession Compass</span>
            <span className="mx-2 text-fg-subtle">·</span>
            <Link
              href="/methodology"
              className="focus-ring underline-offset-2 hover:text-fg hover:underline"
            >
              Methodology
            </Link>
            <span className="mx-2 text-fg-subtle">·</span>
            <Link
              href="/about"
              className="focus-ring underline-offset-2 hover:text-fg hover:underline"
            >
              About
            </Link>
          </p>
          <p className="text-[11px] font-mono uppercase tracking-wider text-fg-subtle">
            Data: FRED · MIT licensed
          </p>
        </div>
      </div>
    </footer>
  );
}
