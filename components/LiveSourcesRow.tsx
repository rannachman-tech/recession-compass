import { formatRelativeTime } from "@/lib/format";

export function LiveSourcesRow({
  generatedAt,
  sources = ["FRED"],
}: {
  generatedAt: string;
  sources?: string[];
}) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-wider text-fg-subtle">
      {sources.map((src) => (
        <span
          key={src}
          className="inline-flex items-center gap-1.5"
          title={`${src} live data`}
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
          />
          {src} <span className="text-emerald-500">✓</span>
        </span>
      ))}
      <span aria-hidden="true" className="text-fg-subtle/60">·</span>
      <span title={generatedAt}>updated {formatRelativeTime(generatedAt)}</span>
    </div>
  );
}
