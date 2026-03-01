import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSession, getSession } from "@/lib/admin-session";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/** POST: create a new QR login session */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = await checkRateLimit("admin-session", ip, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "For mange forsøg. Vent venligst." },
      { status: 429 }
    );
  }

  const session = await createSession();
  const qrUrl = `${BASE_URL}/admin/verify?token=${session.challenge1}`;

  return NextResponse.json({
    sessionId: session.id,
    qrUrl,
    step: session.step,
  });
}

/** GET: poll session status */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("id");
  if (!sessionId) {
    return NextResponse.json(
      { error: "Mangler session id" },
      { status: 400 }
    );
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: "Session udløbet" },
      { status: 404 }
    );
  }

  const response: Record<string, unknown> = { step: session.step };

  if (session.step === 2 && session.challenge2) {
    response.qrUrl = `${BASE_URL}/admin/verify?token=${session.challenge2}`;
  } else if (session.step === 3 && session.challenge3) {
    response.qrUrl = `${BASE_URL}/admin/verify?token=${session.challenge3}`;
  }

  if (session.step === "authenticated" && session.jwt) {
    response.jwt = session.jwt;
  }

  return NextResponse.json(response);
}
