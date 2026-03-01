import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { generateJwt } from "@/lib/admin-auth";

/**
 * POST: Register a device using an invite token.
 * Registers device + issues JWT cookie → user is immediately logged in.
 * Body: { token: string, deviceId: string, label?: string }
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = await checkRateLimit("admin-register", ip, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "For mange forsøg" },
      { status: 429 }
    );
  }

  let body: { token?: string; deviceId?: string; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig body" }, { status: 400 });
  }

  const { token, deviceId, label } = body;
  if (!token || !deviceId) {
    return NextResponse.json(
      { error: "Mangler token eller deviceId" },
      { status: 400 }
    );
  }

  // Find invite
  const invite = await prisma.adminInvite.findUnique({
    where: { token },
  });

  if (!invite) {
    return NextResponse.json({ error: "Ugyldigt link" }, { status: 400 });
  }

  if (invite.usedAt) {
    return NextResponse.json(
      { error: "Link er allerede brugt" },
      { status: 400 }
    );
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json({ error: "Link er udløbet" }, { status: 400 });
  }

  // Find or create admin user
  let adminUser;
  if (invite.email) {
    adminUser = await prisma.adminUser.findUnique({
      where: { email: invite.email },
    });
  }

  if (!adminUser) {
    adminUser = await prisma.adminUser.create({
      data: {
        email: invite.email || `device-${deviceId.slice(0, 8)}@admin.local`,
        phone: invite.phone,
        role: "admin",
      },
    });
  }

  // Register device
  await prisma.adminDevice.upsert({
    where: {
      adminUserId_deviceId: {
        adminUserId: adminUser.id,
        deviceId,
      },
    },
    create: {
      adminUserId: adminUser.id,
      deviceId,
      label: label || null,
    },
    update: {
      active: true,
      lastUsedAt: new Date(),
      label: label || undefined,
    },
  });

  // Mark invite as used
  await prisma.adminInvite.update({
    where: { id: invite.id },
    data: { usedAt: new Date() },
  });

  // Issue JWT and set cookie → logged in immediately
  const jwt = await generateJwt({
    sub: String(adminUser.id),
    email: adminUser.email,
    role: adminUser.role,
    deviceId,
  });

  const response = NextResponse.json({
    ok: true,
    message: "Enhed registreret!",
  });
  response.cookies.set("admin_token", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  return response;
}
