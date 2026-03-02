import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/admin-auth";
import { consumeExchangeCode } from "@/lib/admin-session";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_TTL = 30 * 60; // 30 minutes max for PC sessions

/**
 * POST: Exchange a one-time code for an HttpOnly JWT cookie.
 * Body: { exchangeCode: string, maxAge?: number }
 * maxAge in seconds, capped at 30 min for PC sessions.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = await checkRateLimit("admin-token-exchange", ip, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "For mange forsøg. Vent venligst." },
      { status: 429 }
    );
  }
  let body: { exchangeCode?: string; maxAge?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig body" }, { status: 400 });
  }

  const { exchangeCode } = body;
  if (!exchangeCode) {
    return NextResponse.json(
      { error: "Mangler exchangeCode" },
      { status: 400 }
    );
  }

  // One-time exchange: retrieve JWT, then delete the code
  const jwt = await consumeExchangeCode(exchangeCode);
  if (!jwt) {
    return NextResponse.json(
      { error: "Ugyldig eller allerede brugt kode" },
      { status: 400 }
    );
  }

  // Verify the JWT is still valid
  const payload = await verifyJwt(jwt);
  if (!payload) {
    return NextResponse.json({ error: "Ugyldig JWT" }, { status: 400 });
  }

  const maxAge =
    body.maxAge != null
      ? Math.min(Math.max(body.maxAge, 60), MAX_TTL)
      : 24 * 60 * 60;

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
