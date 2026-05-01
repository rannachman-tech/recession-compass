"use client";

import type { ThemeMode } from "@/lib/types";

export function ThemeToggle({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (next: ThemeMode) => void;
}) {
  const next: ThemeMode = value === "dark" ? "light" : "dark";
  const label =
    value === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      aria-label={label}
      title={label}
      className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-fg-muted hover:text-fg hover:border-border-strong"
    >
      {value === "dark" ? (
        // Sun (in dark mode) → click to go light
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon (in light mode) → click to go dark
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
