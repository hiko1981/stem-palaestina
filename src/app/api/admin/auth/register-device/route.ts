import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

/**
 * POST: Register a device using a magic link token.
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
    include: { inviter: true },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Ugyldigt link" },
      { status: 400 }
    );
  }

  if (invite.usedAt) {
    return NextResponse.json(
      { error: "Link er allerede brugt" },
      { status: 400 }
    );
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json(
      { error: "Link er udløbet" },
      { status: 400 }
    );
  }

  // Find or create admin user for the invitee
  let adminUser;
  if (invite.email) {
    adminUser = await prisma.adminUser.findUnique({
      where: { email: invite.email },
    });
  }

  if (!adminUser) {
    // Create new admin from invite
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

  return NextResponse.json({
    ok: true,
    message: "Enhed registreret! Du kan nu bruge QR-login på computeren.",
    adminEmail: adminUser.email,
  });
}
