"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompositeHistoryPoint } from "@/lib/types";
import { PhasesLegend } from "./PhasesLegend";

interface Props {
  history: CompositeHistoryPoint[];
  recessions: Array<{ start: string; end: string; label?: string }>;
  bandsLabel: string;
  /** Current composite score — used to highlight the active phase in the legend. */
  currentScore?: number;
}

export function DeepChart({
  history,
  recessions,
  bandsLabel,
  currentScore,
}: Props) {
  const data = useMemo(
    () =>
      history.map((p) => ({
        ...p,
        t: new Date(p.date).getTime(),
      })),
    [history]
  );

  const minT = data.length ? data[0].t : 0;
  const maxT = data.length ? data[data.length - 1].t : 0;

  return (
    <section aria-label="50-year history" className="mt-12 sm:mt-16">
      <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
            50-year history
          </h2>
          <p className="mt-1 text-[14px] text-fg-muted">
            Composite score plotted against {bandsLabel.toLowerCase()}. Drag
            or hover to inspect a date.
          </p>
        </div>
        <PhasesLegend activeScore={currentScore} />
      </header>

      <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
        <div className="h-[260px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                stroke="rgb(var(--border))"
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis
                dataKey="t"
                type="number"
                domain={[minT, maxT]}
                scale="time"
                tickFormatter={(t) => new Date(t).getFullYear().toString()}
                tick={{ fill: "rgb(var(--fg-subtle))", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgb(var(--border))" }}
                minTickGap={48}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fill: "rgb(var(--fg-subtle))", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgb(var(--border))" }}
                width={28}
              />

              {recessions.map((r) => (
                <ReferenceArea
                  key={`${r.start}-${r.end}`}
                  x1={new Date(r.start).getTime()}
                  x2={new Date(r.end).getTime()}
                  y1={0}
                  y2={100}
                  fill="rgb(var(--storm))"
                  fillOpacity={0.07}
                  stroke="rgb(var(--storm))"
                  strokeOpacity={0.18}
                  ifOverflow="visible"
                />
              ))}

              <ReferenceLine
                y={60}
                stroke="rgb(var(--warning))"
                strokeDasharray="2 4"
                strokeOpacity={0.28}
              />
              <ReferenceLine
                y={80}
                stroke="rgb(var(--storm))"
                strokeDasharray="2 4"
                strokeOpacity={0.28}
              />

              <Tooltip
                cursor={{ stroke: "rgb(var(--border-strong))", strokeWidth: 1 }}
                contentStyle={{
                  background: "rgb(var(--surface))",
                  border: "1px solid rgb(var(--border-strong))",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "rgb(var(--fg))",
                }}
                labelFormatter={(t) =>
                  new Date(Number(t)).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                  })
                }
                formatter={(v: number) => [Math.round(v), "Score"]}
              />

              <Line
                type="monotone"
                dataKey="score"
                stroke="rgb(var(--fg))"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          <Legend color="rgb(var(--fg))" kind="line" label="Composite score" />
          <Legend color="rgb(var(--storm))" kind="band" label={bandsLabel} />
        </div>
      </div>
    </section>
  );
}

function Legend({
  color,
  kind,
  label,
}: {
  color: string;
  kind: "line" | "dash" | "band";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {kind === "line" && (
        <span
          aria-hidden="true"
          className="inline-block h-[2px] w-5"
          style={{ background: color }}
        />
      )}
      {kind === "dash" && (
        <span
          aria-hidden="true"
          className="inline-block h-[2px] w-5"
          style={{
            background: `repeating-linear-gradient(to right, ${color} 0 4px, transparent 4px 8px)`,
          }}
        />
      )}
      {kind === "band" && (
        <span
          aria-hidden="true"
          className="inline-block h-3 w-3 rounded-sm"
          style={{ background: color, opacity: 0.18, border: `1px solid ${color}` }}
        />
      )}
      {label}
    </span>
  );
}
