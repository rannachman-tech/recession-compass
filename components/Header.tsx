"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { EtoroConnectedBadge } from "./EtoroConnectedBadge";
import { loadPrefs, savePrefs } from "@/lib/storage";
import type { ThemeMode } from "@/lib/types";

export function Header() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const prefs = loadPrefs();
    setTheme(prefs.theme);
    document.documentElement.classList.toggle("dark", prefs.theme === "dark");
  }, []);

  const onToggle = (next: ThemeMode) => {
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    const prefs = loadPrefs();
    savePrefs({ ...prefs, theme: next });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link
            href="/"
            className="focus-ring inline-flex items-baseline gap-2"
            aria-label="Recession Compass — home"
          >
            <span aria-hidden="true" className="text-[15px]">◐</span>
            <span className="text-[15px] font-semibold tracking-tight text-fg">
              Recession Compass
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <EtoroConnectedBadge />
            <ThemeToggle value={theme} onChange={onToggle} />
          </div>
        </div>
      </div>
    </header>
  );
}
