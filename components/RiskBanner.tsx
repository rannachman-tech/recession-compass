/**
 * Compliance — top risk warning banner. Required on every eToro-domain app.
 * Kept extremely small (visual weight ~ 11px) so it doesn't compete with content.
 */
export function RiskBanner() {
  return (
    <div className="border-b border-border bg-surface-2/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2">
        <p className="text-[11px] leading-relaxed text-fg-subtle">
          Capital at risk. Past performance is not an indication of future
          results. The score on this page is informational only and is not
          financial advice. See methodology &amp; sources.
        </p>
      </div>
    </div>
  );
}
