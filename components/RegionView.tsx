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
        className="mt-6 sm:mt-10"
      >
        <div className="flex flex-col items-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
            {data.regionLabel}
          </div>
          <div className="mt-6 sm:mt-8 w-full max-w-[640px]">
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
      </section>

      <GaugePanel indicators={data.indicators} />

      <DeepChart
        history={data.history}
        recessions={data.recessions}
        bandsLabel={cfg.bandsLabel}
        currentScore={data.score}
      />

      <InsightsCard insights={data.insights} />

      <div className="mt-10">
        <ConnectEtoroCta
          variant="contextual"
          region={data.regionLabel}
          score={data.score}
        />
      </div>

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
