import { NextRequest, NextResponse } from "next/server";
import { randomInt, timingSafeEqual } from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { generateJwt } from "@/lib/admin-auth";
import { sendSms } from "@/lib/sms";
import {
  storeRegVerifyCode,
  getRegVerifyData,
  deleteRegVerifyData,
} from "@/lib/admin-session";

/**
 * POST: Register a device using an invite token.
 *
 * Two-step flow:
 *   Step 1 (no `code`): validate invite, send SMS verification code → { needsVerification }
 *   Step 2 (with `code`): verify code, register device, issue JWT cookie
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await checkRateLimit("admin-register", ip, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "For mange forsøg" },
      { status: 429 }
    );
  }

  let body: {
    token?: string;
    deviceId?: string;
    label?: string;
    publicKey?: string;
    code?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig body" }, { status: 400 });
  }

  const { token, deviceId, label, publicKey, code } = body;
  if (!token || !deviceId) {
    return NextResponse.json(
      { error: "Mangler token eller deviceId" },
      { status: 400 }
    );
  }

  // Require cryptographic public key
  if (!publicKey) {
    return NextResponse.json(
      { error: "Kryptografisk nøgle påkrævet" },
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

  // Invite must be tied to a phone number
  if (!invite.phone) {
    return NextResponse.json(
      { error: "Invitation mangler telefonnummer" },
      { status: 400 }
    );
  }

  // ── Step 1: no code → send SMS verification ──────────────────────────
  if (!code) {
    const existing = await getRegVerifyData(token);
    if (existing && existing.attempts >= 3) {
      return NextResponse.json(
        { error: "For mange forsøg. Bed om ny invitation." },
        { status: 429 }
      );
    }

    const verifyCode = String(randomInt(100000, 1000000));
    await storeRegVerifyCode(token, {
      code: verifyCode,
      phone: invite.phone,
      attempts: 0,
    });

    try {
      await sendSms(
        invite.phone,
        `Din bekræftelseskode for Stem Palæstina admin:\n\n${verifyCode}\n\nKoden udløber om 5 minutter.`
      );
    } catch {
      await deleteRegVerifyData(token);
      return NextResponse.json(
        { error: "Kunne ikke sende SMS. Prøv igen." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      needsVerification: true,
      phoneLast4: invite.phone.slice(-4),
    });
  }

  // ── Step 2: verify code → complete registration ──────────────────────
  const verifyData = await getRegVerifyData(token);
  if (!verifyData) {
    return NextResponse.json(
      { error: "Bekræftelseskode udløbet. Prøv igen uden kode." },
      { status: 400 }
    );
  }

  if (verifyData.attempts >= 3) {
    await deleteRegVerifyData(token);
    return NextResponse.json(
      { error: "For mange forsøg. Bed om ny invitation." },
      { status: 429 }
    );
  }

  // Timing-safe comparison of verification code
  const codeMatch =
    code.length === verifyData.code.length &&
    timingSafeEqual(Buffer.from(code), Buffer.from(verifyData.code));

  if (!codeMatch) {
    verifyData.attempts++;
    await storeRegVerifyCode(token, verifyData);
    return NextResponse.json(
      { error: "Forkert kode. Prøv igen." },
      { status: 400 }
    );
  }

  // Code verified — clean up
  await deleteRegVerifyData(token);

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
        name: invite.name || null,
        role: "admin",
      },
    });
  } else if (invite.name && !adminUser.name) {
    adminUser = await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { name: invite.name },
    });
  }

  // Register device with public key (required)
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
      publicKey,
      label: label || null,
    },
    update: {
      active: true,
      lastUsedAt: new Date(),
      publicKey,
      label: label || undefined,
    },
  });

  // Mark invite as used
  await prisma.adminInvite.update({
    where: { id: invite.id },
    data: { usedAt: new Date() },
  });

  // Issue JWT and set cookie
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
