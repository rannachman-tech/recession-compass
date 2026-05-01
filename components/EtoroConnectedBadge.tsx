"use client";

import { useEffect, useState } from "react";
import { loadEtoroSession, type EtoroSession } from "@/lib/etoro-storage";
import { EtoroConnectModal } from "./EtoroConnectModal";

export function EtoroConnectedBadge() {
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [open, setOpen] = useState(false);

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

  // Allow other parts of the app to open the modal via a global event.
  useEffect(() => {
    const open = () => setOpen(true);
    window.addEventListener("rc-open-etoro-modal", open);
    return () => window.removeEventListener("rc-open-etoro-modal", open);
  }, []);

  // Backwards-compat: older sessions stored "cid-XXXX" as the username.
  // Display them as "etoro-user" so users don't see raw CIDs.
  const cleanUsername = session && /^cid-/i.test(session.profile.username)
    ? "etoro-user"
    : session?.profile.username;

  return (
    <>
      {session ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring inline-flex h-8 items-center gap-2 rounded-md border border-border-strong bg-surface px-2.5 text-[12px] text-fg hover:bg-surface-2"
          title={`Connected as @${cleanUsername} (${session.env})`}
        >
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
          />
          <span className="font-medium">@{cleanUsername}</span>
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
            {session.env === "demo" ? "virtual" : "real"}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring inline-flex h-8 items-center rounded-md border border-border-strong bg-fg px-3 text-[12px] font-medium text-bg hover:bg-accent"
        >
          Connect eToro
          <span aria-hidden="true" className="ml-1.5">→</span>
        </button>
      )}

      <EtoroConnectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
