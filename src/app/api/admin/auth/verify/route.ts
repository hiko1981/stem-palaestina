import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { generateJwt } from "@/lib/admin-auth";
import {
  resolveToken,
  consumeToken,
  getSession,
  advanceToStep2,
  advanceToStep3,
  markAuthenticated,
  markFailed,
} from "@/lib/admin-session";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/** POST: phone sends {token, deviceId} to verify a QR step */
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

  // Consume token (single-use)
  await consumeToken(token);

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: "Session udløbet" },
      { status: 400 }
    );
  }

  // Step 1: device scans first QR
  if (session.step === 1 && token === session.challenge1) {
    // Look up device in database
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

    // Advance to step 2
    const challenge2 = await advanceToStep2(
      session,
      deviceId,
      device.adminUserId
    );

    // Update last used
    await prisma.adminDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      step: 2,
      message: "Trin 1 godkendt. Scan QR #2 fra computerskærmen.",
      nextQrUrl: `${BASE_URL}/admin/verify?token=${challenge2}`,
    });
  }

  // Step 2: device scans second QR
  if (session.step === 2 && token === session.challenge2) {
    // Verify same device
    if (session.deviceId !== deviceId) {
      await markFailed(session);
      return NextResponse.json(
        { error: "Forkert enhed. Brug samme telefon." },
        { status: 403 }
      );
    }

    const challenge3 = await advanceToStep3(session);

    return NextResponse.json({
      ok: true,
      step: 3,
      message: "Trin 2 godkendt. Scan QR #3 fra computerskærmen.",
      nextQrUrl: `${BASE_URL}/admin/verify?token=${challenge3}`,
    });
  }

  // Step 3: device scans third QR → generate JWT
  if (session.step === 3 && token === session.challenge3) {
    if (session.deviceId !== deviceId) {
      await markFailed(session);
      return NextResponse.json(
        { error: "Forkert enhed. Brug samme telefon." },
        { status: 403 }
      );
    }

    // Fetch admin user
    const admin = await prisma.adminUser.findUnique({
      where: { id: session.adminUserId! },
    });

    if (!admin || !admin.active) {
      await markFailed(session);
      return NextResponse.json(
        { error: "Admin-bruger deaktiveret" },
        { status: 403 }
      );
    }

    const jwt = await generateJwt({
      sub: String(admin.id),
      email: admin.email,
      role: admin.role,
      deviceId,
    });

    await markAuthenticated(session, jwt);

    return NextResponse.json({
      ok: true,
      step: "authenticated",
      message: "Login godkendt! Computeren logger ind nu.",
    });
  }

  return NextResponse.json(
    { error: "Ugyldigt trin eller token" },
    { status: 400 }
  );
}
