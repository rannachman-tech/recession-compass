"use client";

import { useEffect, useId, useState } from "react";
import { interpret, ZONE_HEX } from "@/lib/interpret";

interface Props {
  /** 0–100 composite score */
  score: number;
  /** Confidence half-width in score units (e.g. 8 → ±8) */
  band: number;
  /** When null, the barometer renders in "calibrating…" state */
  calibrating?: boolean;
}

/**
 * Hand-built barometer. SVG only — no chart library.
 *
 * Layout: semicircular dial in a 400×240 viewBox. The dial centre is (200, 200).
 * Score 0 is at the left (-90° from vertical), score 100 at the right (+90°).
 * Zones: 0–30 clear, 30–60 watch, 60–80 warning, 80–100 storm.
 *
 * Motion: needle starts at score=0 on mount, then animates to its target with
 * a weighted ease-out curve (.needle-motion in globals.css). When the prop
 * changes, the needle re-eases to the new target.
 */
export function Barometer({ score, band, calibrating = false }: Props) {
  const targetScore = clamp(score, 0, 100);
  const [renderedScore, setRenderedScore] = useState(0);
  const id = useId();

  // Animate from 0 → target on first paint, then track target after.
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setRenderedScore(calibrating ? 50 : targetScore);
    });
    return () => cancelAnimationFrame(handle);
  }, [targetScore, calibrating]);

  const needleAngle = scoreToAngle(renderedScore);
  const { label, zone } = interpret(targetScore);
  const zoneHex = ZONE_HEX[zone];

  // Confidence band geometry.
  const lo = clamp(targetScore - band, 0, 100);
  const hi = clamp(targetScore + band, 0, 100);
  const bandPath = describeArc(200, 200, 130, scoreToAngle(lo), scoreToAngle(hi));

  // Colored zone arcs.
  const arcRadius = 160;

  return (
    <figure
      className="flex w-full max-w-[640px] flex-col items-center"
      aria-label={`Recession probability score ${calibrating ? "calibrating" : Math.round(targetScore)} of 100. ${label}`}
    >
      <svg
        viewBox="0 0 400 240"
        className="block w-full"
        role="img"
        aria-hidden="false"
      >
        {/* Subtle radial wash to give the dial a sense of depth */}
        <defs>
          <radialGradient id={`${id}-wash`} cx="50%" cy="100%" r="70%">
            <stop offset="0%" stopColor="rgb(var(--surface) / 0.0)" />
            <stop offset="60%" stopColor="rgb(var(--surface) / 0.0)" />
            <stop offset="100%" stopColor="rgb(var(--surface-2) / 0.6)" />
          </radialGradient>
          <linearGradient id={`${id}-needle`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(var(--fg))" />
            <stop offset="100%" stopColor="rgb(var(--fg-muted))" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="400" height="240" fill={`url(#${id}-wash)`} />

        {/* Outer hairline arc */}
        <path
          d={describeArc(200, 200, arcRadius + 8, -90, 90)}
          fill="none"
          stroke="rgb(var(--border))"
          strokeWidth="1"
        />

        {/* Zone arcs (subtle — they tint the zone, not paint it solid) */}
        {ZONE_ARCS.map((z) => (
          <path
            key={z.zone}
            d={describeArc(
              200,
              200,
              arcRadius,
              scoreToAngle(z.start),
              scoreToAngle(z.end)
            )}
            fill="none"
            stroke={ZONE_HEX[z.zone as keyof typeof ZONE_HEX]}
            strokeWidth="14"
            strokeLinecap="butt"
            opacity={zone === z.zone ? 0.95 : 0.32}
          />
        ))}

        {/* Inner hairline */}
        <path
          d={describeArc(200, 200, arcRadius - 14, -90, 90)}
          fill="none"
          stroke="rgb(var(--border))"
          strokeWidth="1"
        />

        {/* Major tick marks */}
        {MAJOR_TICKS.map((t) => {
          const a = scoreToAngle(t);
          const inner = polar(200, 200, arcRadius - 24, a);
          const outer = polar(200, 200, arcRadius - 14, a);
          return (
            <line
              key={t}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgb(var(--fg-muted))"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}

        {/* Minor ticks */}
        {MINOR_TICKS.map((t) => {
          const a = scoreToAngle(t);
          const inner = polar(200, 200, arcRadius - 20, a);
          const outer = polar(200, 200, arcRadius - 14, a);
          return (
            <line
              key={t}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgb(var(--fg-subtle))"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.6"
            />
          );
        })}

        {/* Tick labels */}
        {MAJOR_TICKS.map((t) => {
          const a = scoreToAngle(t);
          const p = polar(200, 200, arcRadius - 38, a);
          return (
            <text
              key={t}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-mono, ui-monospace)"
              fontSize="10"
              letterSpacing="0.05em"
              fill="rgb(var(--fg-subtle))"
            >
              {t}
            </text>
          );
        })}

        {/* Confidence band — drawn behind the needle, faint */}
        {!calibrating && band > 0 && (
          <path
            d={bandPath}
            fill="none"
            stroke={zoneHex}
            strokeWidth="20"
            strokeLinecap="butt"
            opacity="0.18"
          />
        )}

        {/* Needle — group rotated about the centre */}
        <g
          className="needle-motion"
          style={{ transform: `rotate(${needleAngle}deg)` }}
        >
          {/* Counterweight (small lobe behind pivot) */}
          <circle cx="200" cy="208" r="6" fill="rgb(var(--fg))" />
          {/* Needle blade — tapered triangle */}
          <polygon
            points="197,200 200,72 203,200"
            fill={`url(#${id}-needle)`}
          />
          {/* Tip highlight */}
          <circle cx="200" cy="72" r="2.5" fill={zoneHex} />
        </g>

        {/* Hub */}
        <circle
          cx="200"
          cy="200"
          r="9"
          fill="rgb(var(--surface))"
          stroke="rgb(var(--border-strong))"
          strokeWidth="1.5"
        />
        <circle cx="200" cy="200" r="3" fill="rgb(var(--fg))" />

        {/* Score readout under the hub */}
        <text
          x="200"
          y="232"
          textAnchor="middle"
          fontFamily="var(--font-mono, ui-monospace)"
          fontSize="12"
          fontWeight="700"
          letterSpacing="0.15em"
          fill="rgb(var(--fg-subtle))"
        >
          {calibrating ? "CALIBRATING…" : `± ${Math.round(band)}`}
        </text>
      </svg>

      <figcaption className="mt-1 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
          Recession probability
        </div>
        <div className="mt-1 flex items-baseline justify-center gap-1.5 tabular-nums">
          <span
            className="text-[44px] font-semibold leading-none tracking-tight text-fg sm:text-[52px]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {calibrating ? "—" : Math.round(targetScore)}
          </span>
          <span className="text-[14px] font-medium text-fg-subtle">/100</span>
        </div>
        <p
          className="mt-1.5 text-[14px] sm:text-[15px] font-medium"
          style={{ color: zoneHex }}
        >
          {calibrating ? "Calibrating instruments…" : label}
        </p>
      </figcaption>
    </figure>
  );
}

// ---------- helpers ----------

const MAJOR_TICKS = [0, 25, 50, 75, 100];
const MINOR_TICKS = [10, 20, 30, 40, 60, 70, 80, 90];

const ZONE_ARCS = [
  { zone: "clear", start: 0, end: 30 },
  { zone: "watch", start: 30, end: 60 },
  { zone: "warning", start: 60, end: 80 },
  { zone: "storm", start: 80, end: 100 },
];

function scoreToAngle(score: number): number {
  // Score 0 → -90° (needle points left). Score 100 → +90° (needle points right).
  return -90 + (clamp(score, 0, 100) / 100) * 180;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  // Our angles use 0° = up, +90° = right (clockwise positive).
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
  // Sweep flag 0 because we draw from end → start (counter-clockwise in SVG)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
