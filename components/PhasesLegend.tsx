import { PHASES, phaseFor } from "@/lib/interpret";

/**
 * Quiet horizontal strip explaining the four phases. Designed to sit above
 * the deep chart so the colored bands and the score number become
 * self-explanatory without a tooltip.
 *
 * The current phase is highlighted (full-saturation swatch + heavier label);
 * the others fade back so the eye lands on "where am I now?" first.
 */
export function PhasesLegend({ activeScore }: { activeScore?: number }) {
  const active = activeScore !== undefined ? phaseFor(activeScore).zone : null;

  return (
    <ul
      aria-label="Phase legend"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wider"
    >
      {PHASES.map((p) => {
        const on = active === p.zone;
        return (
          <li
            key={p.zone}
            className="inline-flex items-center gap-1.5"
            title={p.label}
          >
            <span
              aria-hidden="true"
              className="inline-block h-2 w-4 rounded-[2px]"
              style={{
                background: p.color,
                opacity: on ? 1 : 0.35,
                boxShadow: on ? `0 0 0 1px ${p.color}` : undefined,
              }}
            />
            <span
              className={
                on ? "text-fg" : "text-fg-subtle"
              }
            >
              {p.range} {p.short}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
