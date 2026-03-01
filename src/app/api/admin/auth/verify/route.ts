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

/**
 * POST: Phone scans QR → sends {token, deviceId}.
 * 3-step verification for PC login.
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

  const sessionId = await resolveToken(token);
  if (!sessionId) {
    return NextResponse.json(
      { error: "Ugyldigt eller udløbet token" },
      { status: 400 }
    );
  }

  await consumeToken(token);

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: "Session udløbet" },
      { status: 400 }
    );
  }

  // --- Step 1: first QR scanned ---
  if (session.step === 1 && token === session.challenge1) {
    const device = await prisma.adminDevice.findFirst({
      where: { deviceId, active: true },
      include: { admin: true },
    });

    if (!device || !device.admin.active) {
      await markFailed(session);
      return NextResponse.json(
        { error: "Enhed ikke genkendt." },
        { status: 403 }
      );
    }

    const c2 = await advanceToStep2(session, deviceId, device.adminUserId);

    await prisma.adminDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      step: 2,
      message: "Trin 1 godkendt. Scan QR #2 fra skærmen.",
      nextQrUrl: `${BASE_URL}/admin/verify?token=${c2}`,
    });
  }

  // --- Step 2: second QR scanned ---
  if (session.step === 2 && token === session.challenge2) {
    if (session.deviceId !== deviceId) {
      await markFailed(session);
      return NextResponse.json(
        { error: "Forkert enhed." },
        { status: 403 }
      );
    }

    const c3 = await advanceToStep3(session);

    return NextResponse.json({
      ok: true,
      step: 3,
      message: "Trin 2 godkendt. Scan QR #3 fra skærmen.",
      nextQrUrl: `${BASE_URL}/admin/verify?token=${c3}`,
    });
  }

  // --- Step 3: third QR scanned → issue JWT ---
  if (session.step === 3 && token === session.challenge3) {
    if (session.deviceId !== deviceId) {
      await markFailed(session);
      return NextResponse.json(
        { error: "Forkert enhed." },
        { status: 403 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.adminUserId! },
    });

    if (!admin || !admin.active) {
      await markFailed(session);
      return NextResponse.json(
        { error: "Admin deaktiveret." },
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
