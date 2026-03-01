import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { generateJwt, verifyDeviceSignature } from "@/lib/admin-auth";

/**
 * POST: Challenge-response login for registered devices.
 *
 * Step 1: { deviceId } → returns { challenge }
 * Step 2: { deviceId, challenge, signature } → returns JWT cookie
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = await checkRateLimit("admin-device-login", ip, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "For mange forsøg. Vent venligst." },
      { status: 429 }
    );
  }

  let body: {
    deviceId?: string;
    challenge?: string;
    signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig body" }, { status: 400 });
  }

  const { deviceId } = body;
  if (!deviceId) {
    return NextResponse.json(
      { error: "Mangler deviceId" },
      { status: 400 }
    );
  }

  const device = await prisma.adminDevice.findFirst({
    where: { deviceId, active: true },
    include: { admin: true },
  });

  if (!device || !device.admin.active) {
    return NextResponse.json(
      { error: "Enhed ikke genkendt" },
      { status: 403 }
    );
  }

  // Step 1: No signature → return challenge
  if (!body.challenge || !body.signature) {
    // If device has no public key (legacy), fall back to simple login
    if (!device.publicKey) {
      return issueJwt(device);
    }

    const challenge = randomBytes(32).toString("hex");
    return NextResponse.json({ challenge });
  }

  // Step 2: Verify signature
  if (!device.publicKey) {
    // Legacy device without crypto — allow simple login
    return issueJwt(device);
  }

  const valid = verifyDeviceSignature(
    device.publicKey,
    body.challenge,
    body.signature
  );

  if (!valid) {
    return NextResponse.json(
      { error: "Ugyldig signatur" },
      { status: 403 }
    );
  }

  return issueJwt(device);
}

async function issueJwt(
  device: {
    id: number;
    deviceId: string;
    admin: { id: number; email: string; role: string };
  }
) {
  await prisma.adminDevice.update({
    where: { id: device.id },
    data: { lastUsedAt: new Date() },
  });

  const jwt = await generateJwt({
    sub: String(device.admin.id),
    email: device.admin.email,
    role: device.admin.role,
    deviceId: device.deviceId,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_token", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  return response;
}
