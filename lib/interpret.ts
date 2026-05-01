/**
 * Map a 0–100 composite score to its banner copy.
 * The bands match BUILD_PLAN.md — keep this and methodology page in sync.
 */
export function interpret(score: number): {
  label: string;
  zone: "clear" | "watch" | "warning" | "storm";
} {
  if (score < 30) return { label: "Skies are clear.", zone: "clear" };
  if (score < 60) return { label: "Storm watch.", zone: "watch" };
  if (score < 80) return { label: "Storm warning.", zone: "warning" };
  return { label: "Storm in progress.", zone: "storm" };
}

export const ZONE_HEX: Record<
  "clear" | "watch" | "warning" | "storm",
  string
> = {
  clear: "rgb(96, 165, 250)",
  watch: "rgb(250, 204, 21)",
  warning: "rgb(251, 146, 60)",
  storm: "rgb(239, 68, 68)",
};
