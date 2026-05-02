import { Barometer } from "./Barometer";
import { GaugePanel } from "./GaugePanel";
import { DeepChart } from "./DeepChart";
import { RegionTabs } from "./RegionTabs";
import { LiveSourcesRow } from "./LiveSourcesRow";
import { ConnectEtoroCta } from "./ConnectEtoroCta";
import { PositionLadder } from "./PositionLadder";
import { InsightsCard } from "./InsightsCard";
import type { RegionData } from "@/lib/types";
import { regionConfig } from "@/lib/regions";

/**
 * Folded layout — keeps every component and the existing visual scheme,
 * just rearranges them into a more compact, less-scrollable dashboard:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ Region tabs                          Live · updated …    │
 *   ├──────────────────────────────────────────────────────────┤
 *   │ [ Barometer + position ladder ]  │  [ Insights card   ]  │
 *   │                                  │                       │   55 / 45 hero
 *   │                                  │  [ Trade-on-eToro  ]  │
 *   ├──────────────────────────────────────────────────────────┤
 *   │ [ Indicators grid — full width ]                         │
 *   ├──────────────────────────────────────────────────────────┤
 *   │ [ Deep history chart — full width ]                      │
 *   ├──────────────────────────────────────────────────────────┤
 *   │ Notes                                                     │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Trade CTA is pinned to the bottom of the right column with mt-auto so
 * it absorbs whatever empty space is left below the insights card (the
 * barometer card sets the row height). Below the lg breakpoint the hero
 * collapses to a single column.
 */
export function RegionView({ data }: { data: RegionData }) {
  const cfg = regionConfig(data.region);
  const calibrating = data.indicators.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="mt-5 flex items-center justify-between gap-3">
        <RegionTabs />
        <LiveSourcesRow generatedAt={data.generatedAt} />
      </div>

      <section
        aria-label={`${data.regionLabel} recession probability`}
        className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-4 lg:gap-6 items-stretch"
      >
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5 flex flex-col items-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
            {data.regionLabel}
          </div>
          <div className="mt-4 sm:mt-6 w-full max-w-[560px]">
            <Barometer
              score={data.score}
              band={data.band}
              calibrating={calibrating}
            />
          </div>
          {!calibrating && (
            <PositionLadder score={data.score} band={data.band} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <InsightsCard insights={data.insights} className="" />
          <div className="mt-auto">
            <ConnectEtoroCta
              variant="contextual"
              region={data.regionLabel}
              regionId={data.region}
              score={data.score}
            />
          </div>
        </div>
      </section>

      <GaugePanel indicators={data.indicators} />

      <DeepChart
        history={data.history}
        recessions={data.recessions}
        bandsLabel={cfg.bandsLabel}
        currentScore={data.score}
      />

      {data.notes.length > 0 && (
        <section className="mt-8">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
            Notes
          </h2>
          <ul className="mt-2 space-y-1 text-[12px] text-fg-muted">
            {data.notes.map((n, i) => (
              <li key={i}>• {n}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
