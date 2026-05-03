import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RiskBanner } from "@/components/RiskBanner";

export const metadata: Metadata = {
  title: {
    default: "Recession Compass",
    template: "%s · Recession Compass",
  },
  description:
    "A free, transparent recession-probability barometer for the US, Europe, UK and the global economy. Built on public FRED data.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://recession-compass.etoro.com"
  ),
  openGraph: {
    title: "Recession Compass",
    description:
      "Is a recession coming? A transparent 0–100 score built from free public data.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

// Inline bootstrap script — applies the right theme class before first paint to
// prevent FOUC. Order of precedence:
//   1. user's saved choice in localStorage (overrides everything)
//   2. OS-level prefers-color-scheme
//   3. fallback to dark if matchMedia is unavailable or throws
// Storage key MUST match lib/storage.ts.
const themeScript = `
(function() {
  try {
    var raw = localStorage.getItem('rc-prefs:v1');
    var mode = raw ? (JSON.parse(raw).theme) : null;
    if (!mode || mode === 'system') {
      mode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark' : 'light';
    }
    if (mode === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col bg-bg text-fg">
        <RiskBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
