import { NextResponse } from "next/server";

/**
 * POST /api/etoro/validate
 * Body: { apiKey: string, userKey: string }
 *
 * Validates the keys by calling eToro's /me endpoint, then resolves the
 * username/avatar via /user-info/people?cidList=<realCid>. Returns the
 * resolved profile or a clear error.
 *
 * NOTE: this endpoint does NOT log or store the user's keys. They pass
 * through this Vercel function briefly during validation, then live only in
 * the user's browser localStorage afterwards.
 */

export const runtime = "edge";
export const dynamic = "force-dynamic";

const BASE = "https://public-api.etoro.com/api/v1";

function uuid(): string {
  // RFC4122 v4
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

interface PeopleResponse {
  data?: Array<{
    userName?: string;
    firstName?: string;
    lastName?: string;
    avatars?: Array<{ url?: string }>;
  }>;
}

export async function POST(req: Request) {
  let body: { apiKey?: string; userKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = (body.apiKey ?? "").trim();
  const userKey = (body.userKey ?? "").trim();
  if (!apiKey || !userKey) {
    return NextResponse.json(
      { ok: false, error: "Both Public API Key and User Key are required." },
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
              ? "eToro rejected those keys. Double-check the Public API Key and User Key."
              : `eToro /me failed (HTTP ${res.status}). ${text.slice(0, 160)}`,
        },
        { status: 200 } // 200 to client; surface the error in the body
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

  // Step 2: /user-info/people?cidList=<realCid> — use realCid (not gcid) per skill notes
  const cidForLookup = me.realCid ?? me.gcid;
  let people: PeopleResponse = {};
  try {
    const res = await fetch(`${BASE}/user-info/people?cidList=${cidForLookup}`, {
      headers: { ...baseHeaders, "x-request-id": uuid() },
    });
    if (res.ok) {
      people = (await res.json()) as PeopleResponse;
    }
  } catch {
    /* non-fatal — we'll fall back to gcid as the displayName */
  }

  const person = people.data?.[0];
  const username = person?.userName ?? `cid-${cidForLookup}`;
  const displayName = [person?.firstName, person?.lastName].filter(Boolean).join(" ") || username;
  const avatarUrl = person?.avatars?.[0]?.url;

  return NextResponse.json({
    ok: true,
    profile: {
      gcid: me.gcid,
      realCid: me.realCid,
      demoCid: me.demoCid,
      username,
      displayName,
      avatarUrl,
    },
  });
}
