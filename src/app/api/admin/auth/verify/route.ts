import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { generateJwt } from "@/lib/admin-auth";
import {
  resolveToken,
  consumeToken,
  getSession,
  markAuthenticated,
  markFailed,
} from "@/lib/admin-session";

/**
 * POST: Phone scans QR → sends {token, deviceId}.
 * Single step: if device is registered → JWT issued → session authenticated.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = await checkRateLimit("admin-verify", ip, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "For mange forsøg. Vent venligst." },
      { status: 429 }
    );
  }

  let body: { token?: string; deviceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig body" }, { status: 400 });
  }

  const { token, deviceId } = body;
  if (!token || !deviceId) {
    return NextResponse.json(
      { error: "Mangler token eller deviceId" },
      { status: 400 }
    );
  }

  // Resolve token → sessionId
  const sessionId = await resolveToken(token);
  if (!sessionId) {
    return NextResponse.json(
      { error: "Ugyldigt eller udløbet token" },
      { status: 400 }
    );
  }

  await consumeToken(token);

  const session = await getSession(sessionId);
  if (!session || session.status !== "pending") {
    return NextResponse.json(
      { error: "Session udløbet eller allerede brugt" },
      { status: 400 }
    );
  }

  // Look up device
  const device = await prisma.adminDevice.findFirst({
    where: { deviceId, active: true },
    include: { admin: true },
  });

  if (!device || !device.admin.active) {
    await markFailed(session);
    return NextResponse.json(
      { error: "Enhed ikke genkendt. Registrer den først." },
      { status: 403 }
    );
  }

  // Generate JWT
  const jwt = await generateJwt({
    sub: String(device.admin.id),
    email: device.admin.email,
    role: device.admin.role,
    deviceId,
  });

  await markAuthenticated(session, jwt, deviceId, device.adminUserId);

  // Update last used
  await prisma.adminDevice.update({
    where: { id: device.id },
    data: { lastUsedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    message: "Login godkendt! Computeren logger ind nu.",
  });
}
