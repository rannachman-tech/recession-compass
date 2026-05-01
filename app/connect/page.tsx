import type { Metadata } from "next";
import Link from "next/link";
import { EtoroConnectForm } from "@/components/EtoroConnectForm";

export const metadata: Metadata = {
  title: "Connect eToro",
  description:
    "Link your eToro account to Recession Compass with your Public API Key and User Key.",
  robots: { index: false, follow: false },
};

export default function ConnectPage() {
  return (
    <main className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Link
        href="/"
        className="focus-ring inline-flex items-center text-[12px] text-fg-muted hover:text-fg"
      >
        ← Back
      </Link>

      <h1 className="mt-4 text-[28px] sm:text-[34px] font-semibold tracking-tight text-fg">
        Connect your eToro account
      </h1>
      <p className="mt-3 text-[14.5px] text-fg-muted leading-relaxed">
        Paste your Public API Key and User Key. We&apos;ll validate them
        against eToro&apos;s <code className="font-mono text-[13px]">/me</code>{" "}
        endpoint, resolve your profile, and store the keys in this
        browser&apos;s localStorage. Nothing is persisted on our servers.
      </p>

      <details className="mt-4 text-[12.5px] text-fg-muted">
        <summary className="cursor-pointer font-mono uppercase tracking-wider text-[10px] text-fg-subtle hover:text-fg">
          How to generate the keys
        </summary>
        <ol className="mt-2 ml-5 list-decimal space-y-1.5">
          <li>Log in to eToro on the web.</li>
          <li>
            Go to <strong>Settings → Trading</strong>.
          </li>
          <li>
            Click <strong>Create New Key</strong>.
          </li>
          <li>
            Choose <strong>Environment</strong> (Real or Virtual/Demo) and{" "}
            <strong>Permissions</strong> (Read or Write — Write needed for
            placing trades from this app).
          </li>
          <li>
            Verify your identity, then copy the generated{" "}
            <strong>User Key</strong> and the page&apos;s <strong>Public API Key</strong>.
          </li>
        </ol>
      </details>

      <div className="mt-6">
        <EtoroConnectForm />
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-fg-subtle">
        Capital at risk. Past performance is not an indication of future
        results. Recession Compass is informational only and does not
        constitute financial advice. Trades placed via your eToro account
        are executed by eToro under their terms.
      </p>
    </main>
  );
}
