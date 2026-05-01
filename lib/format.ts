export function formatNumber(
  value: number | null | undefined,
  opts: { digits?: number; sign?: boolean; suffix?: string } = {}
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const { digits = 2, sign = false, suffix = "" } = opts;
  const formatted = value.toFixed(digits);
  const out = sign && value > 0 ? `+${formatted}` : formatted;
  return suffix ? `${out}${suffix}` : out;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = now - then;
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.round(days / 30);
    return `${months}mo ago`;
  } catch {
    return "";
  }
}
