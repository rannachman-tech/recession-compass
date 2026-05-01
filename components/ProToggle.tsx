"use client";

import type { DepthMode } from "@/lib/types";

export function ProToggle({
  value,
  onChange,
}: {
  value: DepthMode;
  onChange: (next: DepthMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Reading depth"
      className="inline-flex items-center rounded-md border border-border p-[2px] text-[11px] font-mono uppercase tracking-wider text-fg-muted"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "plain"}
        onClick={() => onChange("plain")}
        className={`focus-ring px-2.5 py-1 rounded-[5px] ${
          value === "plain"
            ? "bg-surface-2 text-fg"
            : "hover:text-fg"
        }`}
      >
        Plain
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "pro"}
        onClick={() => onChange("pro")}
        className={`focus-ring px-2.5 py-1 rounded-[5px] ${
          value === "pro"
            ? "bg-surface-2 text-fg"
            : "hover:text-fg"
        }`}
      >
        Pro
      </button>
    </div>
  );
}
