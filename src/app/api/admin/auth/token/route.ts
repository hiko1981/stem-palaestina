import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/admin-auth";

const MAX_TTL = 30 * 60; // 30 minutes max for PC sessions

/**
 * POST: Set JWT as HttpOnly cookie.
 * Body: { jwt: string, maxAge?: number }
 * maxAge in seconds, capped at 30 min for PC sessions.
 * Omit maxAge for persistent 24h cookie (phone device login).
 */
export async function POST(req: NextRequest) {
  let body: { jwt?: string; maxAge?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig body" }, { status: 400 });
  }

  const { jwt } = body;
  if (!jwt) {
    return NextResponse.json({ error: "Mangler jwt" }, { status: 400 });
  }

  const payload = await verifyJwt(jwt);
  if (!payload) {
    return NextResponse.json({ error: "Ugyldig JWT" }, { status: 400 });
  }

  // Cap maxAge at MAX_TTL if provided
  const maxAge =
    body.maxAge != null
      ? Math.min(Math.max(body.maxAge, 60), MAX_TTL) // min 1 min, max 30 min
      : 24 * 60 * 60; // default 24h (phone)

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_token", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge,
    path: "/",
  });

  return response;
}
