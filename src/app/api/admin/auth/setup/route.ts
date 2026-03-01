import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/**
 * POST: Bootstrap — create magic link for master admin device registration.
 * Requires legacy ADMIN_PASSWORD auth.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = await checkRateLimit("admin-setup", ip, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "For mange forsøg" },
      { status: 429 }
    );
  }

  // Require legacy password
  if (!ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD not configured" },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${ADMIN_PASSWORD}`;
  if (
    auth.length !== expected.length ||
    !timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find or create master admin
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email = body.email || "hikmetaltunmail@gmail.com";

  let admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    admin = await prisma.adminUser.create({
      data: {
        email,
        phone: "+4527141448",
        name: "Hikmet Altun",
        role: "master",
      },
    });
  }

  // Create an invite token for device registration
  const invite = await prisma.adminInvite.create({
    data: {
      invitedBy: admin.id,
      email: admin.email,
      phone: admin.phone,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const setupUrl = `${BASE_URL}/admin/setup?token=${invite.token}`;

  return NextResponse.json({
    ok: true,
    setupUrl,
    message: `Åbn dette link på din telefon for at registrere den: ${setupUrl}`,
  });
}
