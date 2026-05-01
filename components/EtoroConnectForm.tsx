"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadEtoroSession,
  saveEtoroSession,
  clearEtoroSession,
  type EtoroEnv,
  type EtoroSession,
} from "@/lib/etoro-storage";

type Status = "idle" | "validating" | "ok" | "error";

export function EtoroConnectForm() {
  const router = useRouter();
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [userKey, setUserKey] = useState("");
  const [env, setEnv] = useState<EtoroEnv>("demo");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const s = loadEtoroSession();
    setSession(s);
    if (s) setEnv(s.env);
  }, []);

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
      const newSession: EtoroSession = {
        apiKey,
        userKey,
        env,
        profile: json.profile,
        connectedAt: new Date().toISOString(),
      };
      saveEtoroSession(newSession);
      setSession(newSession);
      setStatus("ok");
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
    router.refresh();
  };

  if (session) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-[14px] font-semibold text-fg">
            {session.profile.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-fg truncate">
                @{session.profile.username}
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
                {session.env}
              </span>
            </div>
            <div className="text-[12px] text-fg-muted">
              {session.profile.displayName}
            </div>
          </div>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-fg-muted">
          Connected since{" "}
          {new Date(session.connectedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          . Your keys are stored in this browser only — they never touch
          our servers after the initial validation.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={disconnect}
            className="focus-ring inline-flex h-9 items-center rounded-md border border-border-strong bg-surface px-3.5 text-[13px] font-medium text-fg hover:bg-surface-2"
          >
            Disconnect
          </button>
          <a
            href="https://www.etoro.com/discover/markets/etfs"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex h-9 items-center rounded-md border border-border-strong bg-fg px-3.5 text-[13px] font-medium text-bg hover:bg-accent"
          >
            Open eToro
            <span aria-hidden="true" className="ml-1.5">→</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-surface p-5 space-y-4">
      <Field
        label="Public API Key"
        hint="The application key — same for everyone using your app."
      >
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="paste your Public API Key"
          className="focus-ring block w-full rounded-md border border-border bg-bg px-3 py-2 text-[13px] font-mono text-fg placeholder:text-fg-subtle"
        />
      </Field>

      <Field
        label="User Key"
        hint="Your account-specific key. Generate one in eToro → Settings → Trading."
      >
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={userKey}
          onChange={(e) => setUserKey(e.target.value)}
          placeholder="paste your User Key"
          className="focus-ring block w-full rounded-md border border-border bg-bg px-3 py-2 text-[13px] font-mono text-fg placeholder:text-fg-subtle"
        />
      </Field>

      <fieldset>
        <legend className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          Environment
        </legend>
        <div className="mt-2 inline-flex rounded-md border border-border p-[2px]">
          <EnvButton current={env} value="demo" onClick={() => setEnv("demo")}>
            Demo (paper)
          </EnvButton>
          <EnvButton current={env} value="real" onClick={() => setEnv("real")}>
            Real
          </EnvButton>
        </div>
        <p className="mt-1 text-[11px] text-fg-subtle">
          Each User Key is bound to one environment. Pick the one that
          matches the key you generated.
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={status === "validating" || !apiKey || !userKey}
          className="focus-ring inline-flex h-10 items-center rounded-md border border-border-strong bg-fg px-4 text-[13px] font-medium text-bg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "validating" ? "Validating…" : "Test connection"}
        </button>
        {status === "error" && (
          <span className="text-[12px] text-storm" style={{ color: "rgb(239, 68, 68)" }}>
            {error}
          </span>
        )}
      </div>

      <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-fg-subtle">
        Keys are stored in this browser's localStorage only. They are sent
        to Recession Compass once for validation against eToro's <code>/me</code> endpoint
        and never stored on our servers. To revoke, click Disconnect or
        regenerate the key in your eToro settings.
      </p>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      {hint && <span className="ml-2 text-[11px] text-fg-subtle">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function EnvButton({
  current,
  value,
  onClick,
  children,
}: {
  current: EtoroEnv;
  value: EtoroEnv;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring rounded-[5px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
        active ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
