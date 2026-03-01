import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/admin-auth";

/**
 * POST: Set JWT as HttpOnly cookie.
 * Body: { jwt: string }
 */
export async function POST(req: NextRequest) {
  let body: { jwt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig body" }, { status: 400 });
  }

  const { jwt } = body;
  if (!jwt) {
    return NextResponse.json(
      { error: "Mangler jwt" },
      { status: 400 }
    );
  }

  // Verify JWT is valid before setting cookie
  const payload = await verifyJwt(jwt);
  if (!payload) {
    return NextResponse.json(
      { error: "Ugyldig JWT" },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_token", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
  });

  return response;
}
