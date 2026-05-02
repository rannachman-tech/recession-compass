"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { phaseFor, ZONE_HEX, type Zone } from "@/lib/interpret";
import { basketFor, allocate } from "@/lib/baskets";
import type { RegionId } from "@/lib/types";
import { loadEtoroSession, type EtoroSession } from "@/lib/etoro-storage";

type Step = "review" | "confirm" | "executing" | "result";

interface TradeResult {
  ticker: string;
  ok: boolean;
  message?: string;
  orderId?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  score: number;
  region: string;
  regionId: RegionId;
}

export function TradeBasketModal({ open, onClose, score, region, regionId }: Props) {
  const phase = phaseFor(score);
  const basket = basketFor(phase.zone, regionId);
  const color = ZONE_HEX[phase.zone];

  const [amount, setAmount] = useState(1000);
  const [step, setStep] = useState<Step>("review");
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [results, setResults] = useState<TradeResult[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setSession(loadEtoroSession());
    setStep("review");
    setResults([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && step !== "executing" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, step]);

  const allocations = useMemo(() => allocate(basket, amount), [basket, amount]);
  const total = useMemo(
    () => allocations.reduce((s, a) => s + a.dollars, 0),
    [allocations]
  );

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const onExecute = async () => {
    if (!session) return;
    setStep("executing");
    try {
      const res = await fetch("/api/etoro/trade-basket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: session.apiKey,
          userKey: session.userKey,
          env: session.env,
          basket: allocations.map((a) => ({
            ticker: a.ticker,
            amount: a.dollars,
            instrumentId: a.instrumentId,
          })),
        }),
      });
      const json = (await res.json()) as { results?: TradeResult[] };
      setResults(json.results ?? []);
      setStep("result");
    } catch (err) {
      setResults([
        { ticker: "—", ok: false, message: (err as Error).message },
      ]);
      setStep("result");
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trade basket"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (
          step !== "executing" &&
          cardRef.current &&
          !cardRef.current.contains(e.target as Node)
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={cardRef}
        className="w-full max-w-xl rounded-xl border border-border bg-surface shadow-2xl max-h-[90vh] flex flex-col"
        style={{ borderTopColor: color, borderTopWidth: 3 }}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: color }}
            />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color }}
            >
              {phase.short} · score {Math.round(score)} · {region}
            </span>
          </div>
          <button
            type="button"
            onClick={() => step !== "executing" && onClose()}
            aria-label="Close"
            disabled={step === "executing"}
            className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4">
          {step === "review" && (
            <ReviewStep
              basket={basket}
              amount={amount}
              onAmountChange={setAmount}
              allocations={allocations}
              total={total}
              color={color}
              session={session}
              onContinue={() => setStep("confirm")}
            />
          )}
          {step === "confirm" && session && (
            <ConfirmStep
              basket={basket}
              amount={amount}
              total={total}
              session={session}
              color={color}
              onBack={() => setStep("review")}
              onExecute={onExecute}
            />
          )}
          {step === "executing" && (
            <ExecutingStep amount={amount} count={allocations.length} color={color} />
          )}
          {step === "result" && (
            <ResultStep results={results} color={color} onClose={onClose} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------- subcomponents ----------

function ReviewStep({
  basket,
  amount,
  onAmountChange,
  allocations,
  total,
  color,
  session,
  onContinue,
}: {
  basket: ReturnType<typeof basketFor>;
  amount: number;
  onAmountChange: (n: number) => void;
  allocations: ReturnType<typeof allocate>;
  total: number;
  color: string;
  session: EtoroSession | null;
  onContinue: () => void;
}) {
  return (
    <>
      <h2 className="text-[20px] font-semibold tracking-tight text-fg">
        {basket.title}
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
        {basket.thesis}
      </p>

      <div className="mt-5">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            Amount
          </span>
          <div className="mt-1 flex items-baseline gap-2 border-b-2 pb-1" style={{ borderColor: color }}>
            <span className="text-[28px] font-light text-fg-muted">$</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              value={amount}
              onChange={(e) =>
                onAmountChange(Math.max(0, Number(e.target.value) || 0))
              }
              className="focus-ring flex-1 bg-transparent text-[28px] font-semibold text-fg tabular-nums outline-none"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[500, 1000, 2500, 5000, 10000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onAmountChange(v)}
                className={`focus-ring rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                  amount === v
                    ? "border-border-strong bg-surface-2 text-fg"
                    : "border-border text-fg-muted hover:text-fg"
                }`}
              >
                ${v.toLocaleString()}
              </button>
            ))}
          </div>
        </label>
      </div>

      <ul className="mt-5 space-y-2.5">
        {allocations.map((a) => (
          <li
            key={a.ticker}
            className="group rounded-lg border border-border p-3 hover:border-border-strong transition-colors"
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[14px] font-bold text-fg">
                    {a.ticker}
                  </span>
                  <span className="text-[12px] text-fg-muted truncate">{a.name}</span>
                </div>
                <p className="mt-1 text-[12px] leading-snug text-fg-muted">
                  {a.shortRationale}
                </p>
                <details className="mt-1 text-[11px] text-fg-subtle">
                  <summary className="cursor-pointer hover:text-fg">
                    Why this one →
                  </summary>
                  <p className="mt-1 leading-relaxed">{a.longRationale}</p>
                </details>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-[15px] font-semibold tabular-nums text-fg">
                  ${a.dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                  {a.weight}%
                </div>
              </div>
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${a.weight}%`,
                  background: color,
                  opacity: 0.55,
                }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
          Total
        </span>
        <span className="font-mono text-[16px] font-semibold tabular-nums text-fg">
          ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-fg-subtle">
        Capital at risk. Past performance is not an indication of future
        results. This is informational only and not financial advice.
        Trades execute against your eToro account on submission.
      </p>

      <div className="mt-4 flex gap-2 justify-end">
        {!session ? (
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("rc-open-etoro-modal"));
            }}
            className="focus-ring inline-flex h-10 items-center rounded-md border border-border-strong bg-fg px-4 text-[13px] font-medium text-bg hover:bg-accent"
          >
            Connect eToro to trade
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            disabled={amount <= 0}
            className="focus-ring inline-flex h-10 items-center rounded-md px-4 text-[13px] font-medium text-bg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: color }}
          >
            Continue · ${total.toLocaleString()} →
          </button>
        )}
      </div>
    </>
  );
}

function ConfirmStep({
  basket,
  amount,
  total,
  session,
  color,
  onBack,
  onExecute,
}: {
  basket: ReturnType<typeof basketFor>;
  amount: number;
  total: number;
  session: EtoroSession;
  color: string;
  onBack: () => void;
  onExecute: () => void;
}) {
  const isReal = session.env === "real";
  return (
    <>
      <h2 className="text-[20px] font-semibold tracking-tight text-fg">
        Confirm trades
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
        Submit {basket.holdings.length} market orders totalling{" "}
        <strong className="text-fg">${total.toLocaleString()}</strong> against
        your eToro account{" "}
        <span className="font-mono text-[12px] text-fg">@{session.profile.username}</span>{" "}
        in{" "}
        <span
          className="font-mono text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5"
          style={{
            background: isReal ? "rgb(239, 68, 68, 0.15)" : "rgb(96, 165, 250, 0.15)",
            color: isReal ? "rgb(239, 68, 68)" : "rgb(96, 165, 250)",
          }}
        >
          {isReal ? "real" : "demo (virtual)"}
        </span>
        .
      </p>

      {isReal && (
        <div
          className="mt-4 rounded-md border p-3"
          style={{
            background: "rgb(239, 68, 68, 0.08)",
            borderColor: "rgb(239, 68, 68, 0.4)",
          }}
        >
          <p className="text-[12px] leading-relaxed" style={{ color: "rgb(239, 68, 68)" }}>
            <strong>Real-money orders.</strong> These will execute against
            your live eToro account and use real funds. Confirm only if
            you&apos;re ready to commit ${total.toLocaleString()}.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-md border border-border overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-surface-2/60 text-fg-subtle">
              <th className="px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wider font-medium">Ticker</th>
              <th className="px-3 py-1.5 text-right font-mono text-[10px] uppercase tracking-wider font-medium">Weight</th>
              <th className="px-3 py-1.5 text-right font-mono text-[10px] uppercase tracking-wider font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {allocate(basket, amount).map((a) => (
              <tr key={a.ticker} className="border-t border-border">
                <td className="px-3 py-2">
                  <span className="font-mono font-semibold text-fg">{a.ticker}</span>
                  <span className="ml-2 text-[11px] text-fg-muted">{a.name}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-fg-muted">
                  {a.weight}%
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold text-fg">
                  ${a.dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            <tr className="border-t border-border-strong bg-surface-2/40">
              <td className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Total</td>
              <td className="px-3 py-2 text-right font-mono text-fg-subtle">100%</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums font-bold text-fg">
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p
        role="note"
        className="mt-4 rounded-md border border-border bg-surface-2/40 px-3 py-2 text-[12px] leading-relaxed text-fg-muted"
      >
        Make sure you have the required funds available in your account.
      </p>

      <div className="mt-4 flex gap-2 justify-end">
        <button
          type="button"
          onClick={onBack}
          className="focus-ring inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-[13px] font-medium text-fg-muted hover:text-fg"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onExecute}
          className="focus-ring inline-flex h-10 items-center rounded-md px-4 text-[13px] font-semibold text-bg"
          style={{ background: color }}
        >
          {isReal ? "Yes — execute real trades" : "Execute demo trades"}
        </button>
      </div>
    </>
  );
}

function ExecutingStep({
  amount,
  count,
  color,
}: {
  amount: number;
  count: number;
  color: string;
}) {
  return (
    <div className="py-8 text-center">
      <div className="inline-block">
        <div
          className="h-10 w-10 rounded-full border-2 border-transparent animate-spin mx-auto"
          style={{ borderTopColor: color, borderRightColor: color }}
        />
      </div>
      <p className="mt-4 text-[14px] text-fg">
        Submitting {count} orders totalling ${amount.toLocaleString()}…
      </p>
      <p className="mt-1 text-[12px] text-fg-subtle">
        Each ticker is being looked up and an order placed via eToro&apos;s API.
        Don&apos;t close this window.
      </p>
    </div>
  );
}

function ResultStep({
  results,
  color,
  onClose,
}: {
  results: TradeResult[];
  color: string;
  onClose: () => void;
}) {
  const okCount = results.filter((r) => r.ok).length;
  const allOk = okCount === results.length && results.length > 0;
  return (
    <>
      <h2 className="text-[20px] font-semibold tracking-tight text-fg">
        {allOk
          ? "All orders submitted"
          : okCount > 0
            ? `${okCount} of ${results.length} submitted`
            : "Submission failed"}
      </h2>
      <div className="mt-4 rounded-md border border-border overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-surface-2/60 text-fg-subtle">
              <th className="px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wider font-medium w-8"></th>
              <th className="px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wider font-medium">Ticker</th>
              <th className="px-3 py-1.5 text-right font-mono text-[10px] uppercase tracking-wider font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-1.5 text-center">
                  <span
                    aria-hidden="true"
                    className="font-mono text-[14px]"
                    style={{ color: r.ok ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)" }}
                  >
                    {r.ok ? "✓" : "✕"}
                  </span>
                </td>
                <td className="px-3 py-1.5 font-mono font-semibold text-fg">{r.ticker}</td>
                <td className="px-3 py-1.5 text-right font-mono text-[11px] text-fg-muted">
                  {r.message ?? (r.ok ? "submitted" : "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="focus-ring inline-flex h-10 items-center rounded-md px-4 text-[13px] font-medium text-bg"
          style={{ background: color }}
        >
          Done
        </button>
      </div>
    </>
  );
}
