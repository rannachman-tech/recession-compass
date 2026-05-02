"use client";

import type { RegionInsights } from "@/lib/types";

const KIND_COLOR: Record<RegionInsights["points"][number]["kind"], string> = {
  concern: "rgb(251, 146, 60)",     // warning orange
  reassurance: "rgb(96, 165, 250)", // clear blue
  notable: "rgb(250, 204, 21)",     // watch yellow
  stale: "rgb(156, 156, 156)",       // neutral gray
};

const KIND_LABEL: Record<RegionInsights["points"][number]["kind"], string> = {
  concern: "Loudest signal",
  reassurance: "Reassurance",
  notable: "Worth noting",
  stale: "Excluded",
};

/**
 * Quiet editorial card. Lives in the right column of the hero grid.
 *
 * Always renders something — the column needs to balance the barometer
 * card next to it. If we have no auto-drafted paragraph (calibrating
 * region, older deploys), shows a brief placeholder explaining why.
 */
export function InsightsCard({
  insights,
  className,
}: {
  insights?: RegionInsights;
  className?: string;
}) {
  const baseClass = "rounded-lg border border-border bg-surface p-4 sm:p-5";
  const wrapper = className !== undefined ? `${baseClass} ${className}` : `${baseClass} mt-10`;

  if (!insights) {
    return (
      <section aria-label="Worth flagging" className={wrapper}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
            Worth flagging
          </h2>
        </div>
        <p className="text-[14.5px] leading-relaxed text-fg-muted">
          Insights resume once this region has fresh indicator data to compare against. The
          barometer and trade suggestion next to it stay live in the meantime.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Worth flagging" className={wrapper}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
          Worth flagging
        </h2>
        {insights.source === "fallback" && (
          <span
            className="font-mono text-[9px] uppercase tracking-wider text-fg-subtle border border-border rounded px-1 py-0.5"
            title="Templated prose — Groq narrative unavailable on this run"
          >
            Auto
          </span>
        )}
      </div>

      <p className="text-[14.5px] leading-relaxed text-fg-muted">
        {insights.paragraph}
      </p>

      {insights.points.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
          {insights.points.map((p, i) => (
            <li
              key={i}
              className="inline-flex items-center gap-1.5 text-fg-subtle"
              title={p.why}
            >
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: KIND_COLOR[p.kind] }}
              />
              <span className="font-mono uppercase tracking-wider" style={{ color: KIND_COLOR[p.kind] }}>
                {KIND_LABEL[p.kind]}
              </span>
              <span className="text-fg-muted">
                {p.label} · {p.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
