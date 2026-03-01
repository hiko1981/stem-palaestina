import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { generateJwt } from "@/lib/admin-auth";

/**
 * POST: Login from a registered device (phone).
 * Body: { deviceId: string }
 * Returns JWT if device is recognized and active.
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

  let body: { deviceId?: string };
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

  // Update last used
  await prisma.adminDevice.update({
    where: { id: device.id },
    data: { lastUsedAt: new Date() },
  });

  const jwt = await generateJwt({
    sub: String(device.admin.id),
    email: device.admin.email,
    role: device.admin.role,
    deviceId,
  });

  // Set cookie directly in response
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
