/**
 * Connect-eToro CTA. Two variants:
 *  - "header"     — compact, always reads "Connect eToro"
 *  - "contextual" — wider, copy + suggested instrument category change with
 *                   the current barometer phase and region.
 */

import { phaseFor, type Zone } from "@/lib/interpret";

const ETORO_BASE = "https://www.etoro.com/discover/markets";

function targetUrl(_zone: Zone): string {
  // TODO: replace with the eToro-confirmed deep link per phase.
  return `${ETORO_BASE}/etfs`;
}

export function ConnectEtoroCta({
  variant = "header",
  region,
  score,
}: {
  variant?: "header" | "contextual";
  region?: string;
  score?: number;
}) {
  if (variant === "header") {
    return (
      <a
        href={`${ETORO_BASE}/etfs`}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring inline-flex h-8 items-center rounded-md border border-border-strong bg-fg px-3 text-[12px] font-medium text-bg hover:bg-accent"
      >
        Connect eToro
        <span aria-hidden="true" className="ml-1.5">→</span>
      </a>
    );
  }

  const phase = score !== undefined ? phaseFor(score) : phaseFor(50);
  const url = targetUrl(phase.zone);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: phase.color }}
            />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: phase.color }}
            >
              {phase.short} · score {score !== undefined ? Math.round(score) : "—"}
            </span>
          </div>
          <h3 className="text-[14px] font-semibold text-fg">
            {phase.ctaTitle}
            {region ? ` for ${region}` : ""}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
            {phase.ctaBody} Capital at risk; not financial advice.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex h-9 items-center rounded-md border border-border-strong bg-fg px-3.5 text-[13px] font-medium text-bg hover:bg-accent shrink-0"
        >
          Open on eToro
          <span aria-hidden="true" className="ml-1.5">→</span>
        </a>
      </div>
    </div>
  );
}
