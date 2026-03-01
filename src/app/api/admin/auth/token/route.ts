import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/admin-auth";

/**
 * POST: Set JWT as HttpOnly cookie.
 * Body: { jwt: string, sessionOnly?: boolean }
 * sessionOnly=true → cookie deleted on browser close (for PC logins)
 */
export async function POST(req: NextRequest) {
  let body: { jwt?: string; sessionOnly?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig body" }, { status: 400 });
  }

  const { jwt, sessionOnly } = body;
  if (!jwt) {
    return NextResponse.json({ error: "Mangler jwt" }, { status: 400 });
  }

  const payload = await verifyJwt(jwt);
  if (!payload) {
    return NextResponse.json({ error: "Ugyldig JWT" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_token", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    // Session-only: omit maxAge → cookie deleted on browser close
    ...(sessionOnly ? {} : { maxAge: 24 * 60 * 60 }),
  });

  return response;
}
