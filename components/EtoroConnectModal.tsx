"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  loadEtoroSession,
  saveEtoroSession,
  clearEtoroSession,
  type EtoroEnv,
  type EtoroSession,
} from "@/lib/etoro-storage";

type Status = "idle" | "validating" | "ok" | "error";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Floating modal for connecting / managing the eToro link.
 * Opens over whatever page the user is on. On successful validation it
 * fires the storage event so the header badge updates, then auto-closes
 * after a beat so the user lands back where they started.
 */
export function EtoroConnectModal({ open, onClose }: Props) {
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [userKey, setUserKey] = useState("");
  const [env, setEnv] = useState<EtoroEnv>("demo");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  // Hydrate when modal opens, reset transient state when it closes.
  useEffect(() => {
    if (!open) return;
    const s = loadEtoroSession();
    setSession(s);
    if (s) setEnv(s.env);
    setStatus("idle");
    setError("");
  }, [open]);

  // ESC to close, lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("validating");
    setError("");
    try {
      const res = await fetch("/api/etoro/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, userKey }),
      });
      const json = await res.json();
      if (!json.ok) {
        setStatus("error");
        setError(json.error || "Unknown error");
        return;
      }
      const detected = (json.detectedEnv as "real" | "demo" | undefined) ?? env;
      const newSession: EtoroSession = {
        apiKey,
        userKey,
        env: detected,
        profile: json.profile,
        connectedAt: new Date().toISOString(),
      };
      saveEtoroSession(newSession);
      setSession(newSession);
      setStatus("ok");
      setTimeout(onClose, 900);
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  };

  const disconnect = () => {
    clearEtoroSession();
    setSession(null);
    setApiKey("");
    setUserKey("");
    setStatus("idle");
    setError("");
  };

  // Portal to document.body so the fixed-positioned overlay escapes the
  // sticky header's containing block (backdrop-filter creates one).
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connect eToro"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={cardRef}
        className="w-full max-w-md rounded-xl border border-border bg-surface shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-[14px] font-semibold text-fg">
            {session ? "eToro account" : "Connect eToro"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-surface-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-5">
          {session ? (
            <ConnectedCard session={session} onDisconnect={disconnect} />
          ) : (
            <ConnectForm
              apiKey={apiKey}
              userKey={userKey}
              status={status}
              error={error}
              onApiKeyChange={setApiKey}
              onUserKeyChange={setUserKey}
              onSubmit={submit}
            />
          )}

          {status === "ok" && (
            <p className="mt-3 text-[12px] text-emerald-500" role="status">
              ✓ Connected. Closing…
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------- subcomponents ----------

function ConnectedCard({
  session,
  onDisconnect,
}: {
  session: EtoroSession;
  onDisconnect: () => void;
}) {
  const cleanUsername = /^cid-/i.test(session.profile.username)
    ? "etoro-user"
    : session.profile.username;
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-[14px] font-semibold text-fg">
          {cleanUsername.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[14px] font-semibold text-fg truncate">
              @{cleanUsername}
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5"
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
              {session.env === "demo" ? "demo (virtual)" : "real"}
            </span>
          </div>
          {session.profile.displayName &&
            session.profile.displayName !== session.profile.username && (
              <div className="text-[12px] text-fg-muted">
                {session.profile.displayName}
              </div>
            )}
        </div>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-fg-muted">
        Keys are stored in this browser&apos;s localStorage only — never on
        our servers. Connected{" "}
        {new Date(session.connectedAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
        .
      </p>

      <div className="mt-4">
        <button
          type="button"
          onClick={onDisconnect}
          className="focus-ring inline-flex h-9 items-center rounded-md border border-border-strong bg-surface px-3.5 text-[13px] font-medium text-fg hover:bg-surface-2"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}

function ConnectForm({
  apiKey,
  userKey,
  status,
  error,
  onApiKeyChange,
  onUserKeyChange,
  onSubmit,
}: {
  apiKey: string;
  userKey: string;
  status: Status;
  error: string;
  onApiKeyChange: (v: string) => void;
  onUserKeyChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-[13px] leading-relaxed text-fg-muted">
        Paste your eToro keys. We&apos;ll validate them, auto-detect whether
        they&apos;re bound to your real or demo account, and store them in
        this browser only.
      </p>

      <Field label="Public API Key">
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="paste your Public API Key"
          className="focus-ring block w-full rounded-md border border-border bg-bg px-3 py-2 text-[13px] font-mono text-fg placeholder:text-fg-subtle"
        />
      </Field>

      <Field label="Private Key">
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={userKey}
          onChange={(e) => onUserKeyChange(e.target.value)}
          placeholder="paste your Private Key"
          className="focus-ring block w-full rounded-md border border-border bg-bg px-3 py-2 text-[13px] font-mono text-fg placeholder:text-fg-subtle"
        />
      </Field>

<details className="text-[12px]">
        <summary className="cursor-pointer font-mono uppercase tracking-wider text-[10px] text-fg-subtle hover:text-fg">
          Where do I get these?
        </summary>
        <ol className="mt-2 ml-5 list-decimal space-y-1 text-fg-muted">
          <li>eToro → Settings → Trading.</li>
          <li>Click <strong>Create New Key</strong>.</li>
          <li>
            Choose Environment (Real or Virtual/Demo) and Permissions
            (Read or Write).
          </li>
          <li>Verify identity and copy the Private Key.</li>
        </ol>
      </details>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={status === "validating" || !apiKey || !userKey}
          className="focus-ring inline-flex h-10 items-center rounded-md border border-border-strong bg-fg px-4 text-[13px] font-medium text-bg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "validating" ? "Validating…" : "Test connection"}
        </button>
        {status === "error" && (
          <span className="text-[12px]" style={{ color: "rgb(239, 68, 68)" }}>
            {error}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}


