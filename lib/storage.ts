"use client";

import type { Prefs, ThemeMode } from "./types";

// Bump version when the Prefs shape changes — and update the bootstrap
// script in app/layout.tsx to match.
const KEY = "rc-prefs:v1";

const DEFAULTS: Prefs = {
  theme: "dark",
  depth: "plain",
  lastRegion: "us",
};

function detectSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  // Default to dark for the family — only fall back to light if the user
  // has an explicit light preference set.
  const prefersLight = window.matchMedia?.(
    "(prefers-color-scheme: light)"
  ).matches;
  return prefersLight ? "light" : "dark";
}

export function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, theme: detectSystemTheme() };
    const parsed = JSON.parse(raw);
    if (parsed.theme === "system" || !parsed.theme) {
      parsed.theme = detectSystemTheme();
    }
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function savePrefs(prefs: Prefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* quota or privacy mode — ignore */
  }
}
