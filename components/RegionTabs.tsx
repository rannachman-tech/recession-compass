"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { REGION_ORDER, regionConfig } from "@/lib/regions";
import type { RegionId } from "@/lib/types";

const HREF: Record<RegionId, string> = {
  us: "/",
  eu: "/europe",
  uk: "/uk",
  global: "/global",
};

export function RegionTabs() {
  const pathname = usePathname();
  const activeId = activeRegion(pathname);

  return (
    <nav
      aria-label="Region"
      className="relative w-full overflow-x-auto scrollbar-hide"
    >
      <ul className="flex min-w-min gap-1 sm:gap-2">
        {REGION_ORDER.map((id) => {
          const cfg = regionConfig(id);
          const active = id === activeId;
          return (
            <li key={id}>
              <Link
                href={HREF[id]}
                aria-current={active ? "page" : undefined}
                className={`focus-ring inline-flex h-8 items-center rounded-md border px-3 text-[12px] font-medium transition-colors ${
                  active
                    ? "border-border-strong bg-surface-2 text-fg"
                    : "border-transparent text-fg-muted hover:text-fg hover:border-border"
                }`}
              >
                {cfg.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bg to-transparent"
      />
    </nav>
  );
}

function activeRegion(pathname: string | null): RegionId | null {
  if (!pathname) return null;
  if (pathname === "/") return "us";
  if (pathname.startsWith("/europe")) return "eu";
  if (pathname.startsWith("/uk")) return "uk";
  if (pathname.startsWith("/global")) return "global";
  return null;
}
