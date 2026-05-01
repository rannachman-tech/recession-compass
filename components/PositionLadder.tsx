"use client";

import { useEffect, useId, useState } from "react";
import { PHASES, phaseFor } from "@/lib/interpret";

/**
 * Horizontal "position ladder" — answers "where are we on the full scale?"
 * Sits below the barometer hero. Linear, immediate, complementary to the
 * semicircular dial above it.
 *
 * Design notes:
 *  - Four colored phase segments at full saturation form the track.
 *  - Active segment gets a subtle outer glow; the others stay full opacity
 *    too so the eye reads the whole scale at once.
 *  - A faint confidence band sits underneath the marker.
 *  - The marker itself is a thin vertical needle with a small score chip
 *    sitting above it. The chip is in the active phase's colour.
 *  - Tick marks under the bar at the four phase boundaries (0, 30, 60, 80,
 *    100) plus the active position.
 *  - Animates the marker from 0 → score on first paint with the same
 *    ease-out as the barometer needle.
 */
export function PositionLadder({
  score,
  band = 0,
}: {
  score: number;
  band?: number;
}) {
  const id = useId();
  const phase = phaseFor(score);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const h = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(h);
  }, [score]);

  // Layout — 600 × 84 viewBox. Track from x=24 to x=576.
  const trackStart = 24;
  const trackEnd = 576;
  const trackY = 32;
  const trackH = 6;
  const w = trackEnd - trackStart;
  const xFor = (s: number) => trackStart + (Math.max(0, Math.min(100, s)) / 100) * w;

  const lo = Math.max(0, score - band);
  const hi = Math.min(100, score + band);

  return (
    <figure
      aria-label={`Position on the 0 to 100 scale: ${Math.round(score)}, in the ${phase.short.toLowerCase()} zone`}
      className="mt-7 w-full max-w-[640px]"
    >
      <svg viewBox="0 0 600 84" className="block w-full">
        <defs>
          <filter id={`${id}-glow`} x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Phase segments. Two-pixel gap between each so they read as
            distinct rungs of the ladder, not one continuous gradient. */}
        {PHASES.map((p, i) => {
          const x = xFor(p.min) + (i === 0 ? 0 : 1);
          const right = xFor(p.max) - (i === PHASES.length - 1 ? 0 : 1);
          const segW = Math.max(1, right - x);
          const isActive = phase.zone === p.zone;
          return (
            <g key={p.zone}>
              <rect
                x={x}
                y={trackY}
                width={segW}
                height={trackH}
                rx={2}
                fill={p.color}
                opacity={isActive ? 1 : 0.42}
                filter={isActive ? `url(#${id}-glow)` : undefined}
              />
              {/* Phase label above each segment */}
              <text
                x={(x + right) / 2}
                y={trackY - 12}
                textAnchor="middle"
                fontSize="9"
                letterSpacing="1.6"
                fill={isActive ? p.color : "rgb(var(--fg-subtle))"}
                fontFamily="var(--font-mono, ui-monospace)"
                style={{ textTransform: "uppercase", fontWeight: 700 }}
              >
                {p.short}
              </text>
            </g>
          );
        })}

        {/* Confidence band — faint extension of the active segment color */}
        {band > 0 && (
          <rect
            x={xFor(lo)}
            y={trackY - 2}
            width={xFor(hi) - xFor(lo)}
            height={trackH + 4}
            rx={3}
            fill={phase.color}
            opacity={0.16}
          />
        )}

        {/* Tick marks at phase boundaries */}
        {[0, 30, 60, 80, 100].map((t) => (
          <g key={t}>
            <line
              x1={xFor(t)}
              y1={trackY + trackH}
              x2={xFor(t)}
              y2={trackY + trackH + 4}
              stroke="rgb(var(--fg-subtle))"
              strokeWidth={1}
            />
            <text
              x={xFor(t)}
              y={trackY + trackH + 18}
              textAnchor="middle"
              fontSize="10"
              fill="rgb(var(--fg-subtle))"
              fontFamily="var(--font-mono, ui-monospace)"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Position marker — vertical needle + score chip above */}
        <g
          className="needle-motion"
          style={{
            transform: `translateX(${xFor(shown) - xFor(0)}px)`,
            transformOrigin: "0 0",
          }}
        >
          <line
            x1={xFor(0)}
            y1={trackY - 6}
            x2={xFor(0)}
            y2={trackY + trackH + 6}
            stroke="rgb(var(--fg))"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {/* Score chip */}
          <g transform={`translate(${xFor(0) - 14}, 0)`}>
            <rect
              x={0}
              y={4}
              width={28}
              height={16}
              rx={3}
              fill={phase.color}
            />
            <text
              x={14}
              y={15}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="rgb(var(--bg))"
              fontFamily="var(--font-mono, ui-monospace)"
            >
              {Math.round(shown)}
            </text>
          </g>
          {/* Subtle pivot dot */}
          <circle
            cx={xFor(0)}
            cy={trackY + trackH / 2}
            r={2.5}
            fill="rgb(var(--fg))"
          />
        </g>
      </svg>
    </figure>
  );
}
