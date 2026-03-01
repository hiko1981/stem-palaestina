import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthError } from "@/lib/admin-auth";
import { sendSms } from "@/lib/sms";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/**
 * POST: Master admin invites a new admin via SMS.
 * Body: { name?: string, phone: string }
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

  let body: { name?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig body" }, { status: 400 });
  }

  const { name, phone } = body;
  if (!phone) {
    return NextResponse.json(
      { error: "Angiv telefonnummer" },
      { status: 400 }
    );
  }

  // Normalize phone to E.164
  let normalizedPhone = phone.trim().replace(/\s+/g, "");
  if (normalizedPhone.startsWith("00")) {
    normalizedPhone = "+" + normalizedPhone.slice(2);
  }
  if (!normalizedPhone.startsWith("+")) {
    normalizedPhone = "+45" + normalizedPhone;
  }

  const invite = await prisma.adminInvite.create({
    data: {
      invitedBy: Number(auth.sub),
      name: name?.trim() || null,
      phone: normalizedPhone,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const setupUrl = `${BASE_URL}/admin/setup?token=${invite.token}`;

  // Send SMS
  const greeting = name?.trim() ? `Hej ${name.trim()}` : "Hej";
  const smsBody = [
    `${greeting}, du er inviteret som administrator for Stem Palæstina.`,
    ``,
    `Klik her for at aktivere din adgang:`,
    setupUrl,
    ``,
    `Bemærk: Denne telefon godkendes som din administrator-enhed. Linket udløber om 1 time.`,
  ].join("\n");

  let smsSent = false;
  try {
    await sendSms(normalizedPhone, smsBody);
    smsSent = true;
  } catch (err) {
    console.error("SMS send error:", err);
  }

  return NextResponse.json({
    ok: true,
    smsSent,
    message: smsSent
      ? `SMS sendt til ${normalizedPhone}`
      : `SMS kunne ikke sendes. Del linket manuelt: ${setupUrl}`,
    setupUrl: smsSent ? undefined : setupUrl,
  });
}
