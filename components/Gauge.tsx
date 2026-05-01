"use client";

import { useEffect, useId, useState } from "react";
import { ZONE_HEX, interpret } from "@/lib/interpret";
import type { IndicatorReading } from "@/lib/types";
import { formatNumber, formatDate } from "@/lib/format";

interface Props {
  indicator: IndicatorReading;
  pro: boolean;
}

/**
 * One small SVG gauge for a single indicator.
 *
 * Layout: 132×96 viewBox semicircular gauge. Tick marker on the threshold.
 * The needle position is the indicator's 0–100 sub-score (NOT the raw value),
 * so all gauges read on the same scale.
 *
 * Hover/focus reveals a one-sentence plain-English explanation. In Pro mode,
 * the raw value and formula become visible by default.
 */
export function Gauge({ indicator, pro }: Props) {
  const id = useId();
  const subZone = interpret(indicator.subScore).zone;
  const color = ZONE_HEX[subZone];

  // Animate sub-score in.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const h = requestAnimationFrame(() => setShown(indicator.subScore));
    return () => cancelAnimationFrame(h);
  }, [indicator.subScore]);

  const angle = subScoreToAngle(shown);
  const tickAngle = thresholdAngle(indicator);

  return (
    <article
      className="group relative flex flex-col rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-strong focus-within:border-border-strong"
      tabIndex={0}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-medium text-fg">{indicator.label}</h3>
        <span
          className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle"
          title={`Weight ${indicator.weight}/100`}
        >
          {indicator.weight}%
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <svg viewBox="0 0 132 76" className="h-[60px] w-[104px]">
          <defs>
            <linearGradient id={`${id}-arc`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(var(--clear))" />
              <stop offset="33%" stopColor="rgb(var(--watch))" />
              <stop offset="70%" stopColor="rgb(var(--warning))" />
              <stop offset="100%" stopColor="rgb(var(--storm))" />
            </linearGradient>
          </defs>

          {/* Track */}
          <path
            d={describeArc(66, 66, 50, -90, 90)}
            fill="none"
            stroke="rgb(var(--surface-2))"
            strokeWidth="6"
          />
          {/* Filled gradient track */}
          <path
            d={describeArc(66, 66, 50, -90, 90)}
            fill="none"
            stroke={`url(#${id}-arc)`}
            strokeWidth="6"
            opacity="0.55"
          />

          {/* Threshold tick */}
          {(() => {
            const inner = polar(66, 66, 44, tickAngle);
            const outer = polar(66, 66, 56, tickAngle);
            return (
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgb(var(--fg))"
                strokeWidth="1.25"
                opacity="0.7"
              />
            );
          })()}

          {/* Needle */}
          <g
            className="needle-motion"
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: "66px 66px",
            }}
          >
            <line
              x1="66"
              y1="66"
              x2="66"
              y2="20"
              stroke="rgb(var(--fg))"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="66" cy="20" r="2" fill={color} />
          </g>

          {/* Hub */}
          <circle
            cx="66"
            cy="66"
            r="4"
            fill="rgb(var(--surface))"
            stroke="rgb(var(--border-strong))"
            strokeWidth="1"
          />
        </svg>

        <div className="text-right">
          <div
            className="font-mono text-[15px] font-semibold tabular-nums leading-none"
            style={{ color }}
          >
            {formatNumber(indicator.value, {
              digits: 2,
              suffix: indicator.unit,
              sign: indicator.unit === "pp",
            })}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            sub-score {Math.round(indicator.subScore)}
          </div>
        </div>
      </div>

      {/* Explanation — visible on hover/focus, or always in Pro */}
      <p
        className={`mt-2 text-[12px] leading-snug text-fg-muted ${
          pro
            ? ""
            : "max-h-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-h-32 group-hover:opacity-100 group-focus-within:max-h-32 group-focus-within:opacity-100"
        }`}
      >
        {indicator.explanation}
      </p>

      {pro && (
        <div className="mt-2 space-y-1 border-t border-border pt-2 font-mono text-[10px] text-fg-subtle">
          <div>
            <span className="uppercase tracking-wider">Formula</span>
            <div className="mt-0.5 break-all text-fg-muted">
              {indicator.formula}
            </div>
          </div>
          <div>
            <span className="uppercase tracking-wider">Source</span>
            <div className="mt-0.5 text-fg-muted">{indicator.source}</div>
          </div>
          <div>
            <span className="uppercase tracking-wider">As of</span>{" "}
            <span className="text-fg-muted">{formatDate(indicator.asOf)}</span>
          </div>
        </div>
      )}
    </article>
  );
}

function subScoreToAngle(s: number): number {
  return -90 + (Math.max(0, Math.min(100, s)) / 100) * 180;
}

function thresholdAngle(ind: IndicatorReading): number {
  // Use the indicator's threshold mapped to its sub-score domain.
  // We approximate by treating sub-score 50 as the threshold marker — it's
  // visually consistent across gauges and matches the mid-point semantics.
  return subScoreToAngle(50);
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const largeArc = Math.abs(endAngle - startAngle) <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}
