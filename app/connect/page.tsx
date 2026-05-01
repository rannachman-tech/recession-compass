"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /connect is no longer a standalone page — the connection flow lives in the
 * EtoroConnectModal triggered from the header. If someone deep-links to
 * /connect (bookmark, old share), we redirect them home and fire the global
 * event so the modal pops open.
 */
export default function ConnectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
    // Slight delay so the navigation lands first.
    const t = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("rc-open-etoro-modal"));
    }, 50);
    return () => clearTimeout(t);
  }, [router]);
  return null;
}
