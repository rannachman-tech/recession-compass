import { NextResponse } from "next/server";

/**
 * POST /api/etoro/validate
 * Body: { apiKey: string, userKey: string }
 *
 * Validates the keys against eToro's /me, then resolves the user profile
 * via /user-info/people. Returns the resolved profile or a clear error.
 *
 * Per the etoro-apps skill: use realCid (not gcid) for cidList lookup.
 * The endpoint never logs or stores the user's keys.
 */

export const runtime = "edge";
export const dynamic = "force-dynamic";

const BASE = "https://public-api.etoro.com/api/v1";

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface MeResponse {
  gcid?: number;
  realCid?: number;
  demoCid?: number;
}

// The /user-info/people response shape varies. Be permissive about reading it.
type AnyJson = Record<string, unknown>;

function pick(obj: unknown, keys: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as AnyJson;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickUserFromPeople(json: unknown): {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
} {
  // Possible top-level shapes: { data: [user] } | [user] | user
  let candidate: unknown = json;
  if (json && typeof json === "object" && Array.isArray((json as AnyJson).data)) {
    candidate = ((json as AnyJson).data as unknown[])[0];
  } else if (Array.isArray(json)) {
    candidate = json[0];
  }
  if (!candidate || typeof candidate !== "object") return {};
  const c = candidate as AnyJson;
  const username = pick(c, ["userName", "username", "user_name", "name", "displayName"]);
  const firstName = pick(c, ["firstName", "first_name", "givenName"]);
  const lastName = pick(c, ["lastName", "last_name", "familyName", "surname"]);
  let avatarUrl: string | undefined;
  const avs = c.avatars;
  if (Array.isArray(avs) && avs.length > 0) {
    avatarUrl = pick(avs[0], ["url", "src", "href"]);
  } else if (typeof c.avatarUrl === "string") {
    avatarUrl = c.avatarUrl as string;
  }
  return { username, firstName, lastName, avatarUrl };
}

export async function POST(req: Request) {
  let body: { apiKey?: string; userKey?: string; usernameOverride?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = (body.apiKey ?? "").trim();
  const userKey = (body.userKey ?? "").trim();
  const overrideUsername = (body.usernameOverride ?? "").trim().replace(/^@/, "");
  if (!apiKey || !userKey) {
    return NextResponse.json(
      { ok: false, error: "Both Public API Key and Private Key are required." },
      { status: 400 }
    );
  }

  const baseHeaders: Record<string, string> = {
    "x-api-key": apiKey,
    "x-user-key": userKey,
  };

  // Step 1: /me
  let me: MeResponse;
  try {
    const res = await fetch(`${BASE}/me`, {
      headers: { ...baseHeaders, "x-request-id": uuid() },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          ok: false,
          error:
            res.status === 401 || res.status === 403
              ? "eToro rejected those keys. Double-check the Public API Key and Private Key."
              : `eToro /me failed (HTTP ${res.status}). ${text.slice(0, 160)}`,
        },
        { status: 200 }
      );
    }
    me = (await res.json()) as MeResponse;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Could not reach eToro: ${(err as Error).message}` },
      { status: 200 }
    );
  }

  if (!me.gcid) {
    return NextResponse.json(
      { ok: false, error: "eToro /me returned no gcid. Keys may be inactive." },
      { status: 200 }
    );
  }

  // Some account types expose username on /me directly. Peek for it.
  const meDirectUsername = pick(me as Record<string, unknown>, [
    "userName",
    "username",
    "user_name",
    "name",
    "displayName",
  ]);

  // Step 2: /user-info/people. Per skill: use realCid not gcid.
  // Try realCid first, then fall back to gcid if realCid lookup is empty.
  let profile = { username: meDirectUsername ?? "", firstName: "", lastName: "", avatarUrl: "" };
  for (const cid of [me.realCid, me.gcid].filter(Boolean) as number[]) {
    try {
      const res = await fetch(`${BASE}/user-info/people?cidList=${cid}`, {
        headers: { ...baseHeaders, "x-request-id": uuid() },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const picked = pickUserFromPeople(json);
      if (picked.username) {
        profile = {
          username: picked.username,
          firstName: picked.firstName ?? "",
          lastName: picked.lastName ?? "",
          avatarUrl: picked.avatarUrl ?? "",
        };
        break;
      }
    } catch {
      /* try next */
    }
  }

  // Final username: explicit user-provided override > resolved profile > friendly fallback.
  const username = overrideUsername || profile.username || "etoro-user";
  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || username;

  return NextResponse.json({
    ok: true,
    profile: {
      gcid: me.gcid,
      realCid: me.realCid,
      demoCid: me.demoCid,
      username,
      displayName,
      avatarUrl: profile.avatarUrl || undefined,
    },
  });
}
