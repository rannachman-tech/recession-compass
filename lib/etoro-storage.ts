"use client";

/**
 * Client-side eToro session storage.
 * Keys live in localStorage on the user's device only — never persisted on
 * any server we control. The /api/etoro/validate route proxies the keys to
 * eToro for verification but does not log or store them.
 */

export type EtoroEnv = "real" | "demo";

export interface EtoroProfile {
  gcid: number;
  realCid?: number;
  demoCid?: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface EtoroSession {
  apiKey: string;
  userKey: string;
  env: EtoroEnv;
  profile: EtoroProfile;
  connectedAt: string;
}

const KEY = "rc-etoro:v1";

export function loadEtoroSession(): EtoroSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EtoroSession;
  } catch {
    return null;
  }
}

export function saveEtoroSession(s: EtoroSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
    // Lightweight cross-tab notification
    window.dispatchEvent(new CustomEvent("rc-etoro-changed"));
  } catch {
    /* quota or privacy mode */
  }
}

export function clearEtoroSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("rc-etoro-changed"));
  } catch {
    /* ignore */
  }
}
