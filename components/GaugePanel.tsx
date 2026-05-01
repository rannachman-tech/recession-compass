"use client";

import { useEffect, useState } from "react";
import { Gauge } from "./Gauge";
import { ProToggle } from "./ProToggle";
import { loadPrefs, savePrefs } from "@/lib/storage";
import type { DepthMode, IndicatorReading } from "@/lib/types";

interface Props {
  indicators: IndicatorReading[];
}

export function GaugePanel({ indicators }: Props) {
  const [depth, setDepth] = useState<DepthMode>("plain");

  useEffect(() => {
    setDepth(loadPrefs().depth);
  }, []);

  const onChange = (next: DepthMode) => {
    setDepth(next);
    const prefs = loadPrefs();
    savePrefs({ ...prefs, depth: next });
  };

  return (
    <section
      aria-label="Indicator service panel"
      className="mt-10 sm:mt-14"
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
            Service panel
          </h2>
          <p className="mt-1 text-[14px] text-fg-muted">
            Each gauge contributes to the composite. Hover to read what it
            means.
          </p>
        </div>
        <ProToggle value={depth} onChange={onChange} />
      </header>

      {/* Mobile: vertical scroll-snap row. Desktop: grid. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide sm:m-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:p-0 lg:grid-cols-4">
        {indicators.map((ind) => (
          <div
            key={ind.id}
            className="w-[260px] shrink-0 snap-center sm:w-auto sm:shrink"
          >
            <Gauge indicator={ind} pro={depth === "pro"} />
          </div>
        ))}
      </div>
    </section>
  );
}
