"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadEtoroSession, type EtoroSession } from "@/lib/etoro-storage";

export function EtoroConnectedBadge() {
  const [session, setSession] = useState<EtoroSession | null>(null);

  useEffect(() => {
    const refresh = () => setSession(loadEtoroSession());
    refresh();
    window.addEventListener("rc-etoro-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("rc-etoro-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!session) {
    return (
      <Link
        href="/connect"
        className="focus-ring inline-flex h-8 items-center rounded-md border border-border-strong bg-fg px-3 text-[12px] font-medium text-bg hover:bg-accent"
      >
        Connect eToro
        <span aria-hidden="true" className="ml-1.5">→</span>
      </Link>
    );
  }

  return (
    <Link
      href="/connect"
      className="focus-ring inline-flex h-8 items-center gap-2 rounded-md border border-border-strong bg-surface px-2.5 text-[12px] text-fg hover:bg-surface-2"
      title={`Connected as @${session.profile.username} (${session.env})`}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
      />
      <span className="font-medium">@{session.profile.username}</span>
      <span
        className="font-mono text-[9px] uppercase tracking-wider rounded px-1 py-0.5"
        style={{
          background:
            session.env === "real"
              ? "rgb(239, 68, 68, 0.15)"
              : "rgb(96, 165, 250, 0.15)",
          color:
            session.env === "real"
              ? "rgb(239, 68, 68)"
              : "rgb(96, 165, 250)",
        }}
      >
        {session.env}
      </span>
    </Link>
  );
}
