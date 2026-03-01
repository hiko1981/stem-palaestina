import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthError } from "@/lib/admin-auth";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/**
 * POST: Master admin invites a new admin.
 * Body: { email?: string, phone?: string }
 * Auth: JWT (master role required)
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = await checkRateLimit("admin-invite", ip, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "For mange forsøg" },
      { status: 429 }
    );
  }

  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  if (auth.role !== "master") {
    return NextResponse.json(
      { error: "Kun master admin kan invitere" },
      { status: 403 }
    );
  }

  let body: { email?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig body" }, { status: 400 });
  }

  const { email, phone } = body;
  if (!email && !phone) {
    return NextResponse.json(
      { error: "Angiv email eller telefon" },
      { status: 400 }
    );
  }

  const invite = await prisma.adminInvite.create({
    data: {
      invitedBy: Number(auth.sub),
      email: email || null,
      phone: phone || null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const setupUrl = `${BASE_URL}/admin/setup?token=${invite.token}`;

  return NextResponse.json({
    ok: true,
    setupUrl,
    token: invite.token,
    message: `Invitationslink oprettet. Del det med den nye admin.`,
  });
}
