/**
 * "Connect eToro" CTA. Header variant is compact; contextual variant is wider
 * and used near the deep chart.
 *
 * The deep-link target is intentionally generic until the eToro app store team
 * can provide a defensive-ETF basket page URL. Update the href in one place.
 */

const ETORO_HREF = "https://www.etoro.com/discover/markets/etfs"; // TODO: replace with defensive basket page

export function ConnectEtoroCta({
  variant = "header",
  region,
}: {
  variant?: "header" | "contextual";
  region?: string;
}) {
  if (variant === "header") {
    return (
      <a
        href={ETORO_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring inline-flex h-8 items-center rounded-md border border-border-strong bg-fg px-3 text-[12px] font-medium text-bg hover:bg-accent"
      >
        Connect eToro
        <span aria-hidden="true" className="ml-1.5">→</span>
      </a>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-fg">
            Position for the cycle on eToro
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
            Browse defensive ETFs{region ? ` relevant to ${region}` : ""} and
            other instruments designed for late-cycle markets. Capital at risk.
          </p>
        </div>
        <a
          href={ETORO_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex h-9 items-center rounded-md border border-border-strong bg-fg px-3.5 text-[13px] font-medium text-bg hover:bg-accent shrink-0"
        >
          Open eToro
          <span aria-hidden="true" className="ml-1.5">→</span>
        </a>
      </div>
    </div>
  );
}
