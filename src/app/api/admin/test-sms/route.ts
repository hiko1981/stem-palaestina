import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAdmin, isAuthError } from "@/lib/admin-auth";
import { sendSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rl = await checkRateLimit("admin-test-sms", ip, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "For mange forsøg. Vent venligst." },
      { status: 429 }
    );
  }

  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  if (auth.role !== "master") {
    return NextResponse.json(
      { error: "Kun master admin" },
      { status: 403 }
    );
  }

  let body: { phone?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig body" }, { status: 400 });
  }

  const { phone, message } = body;
  if (!phone) {
    return NextResponse.json({ error: "Mangler telefonnummer" }, { status: 400 });
  }

  try {
    await sendSms(phone, message || "Test fra Stem Palæstina.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
