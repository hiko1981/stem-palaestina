import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPhone } from "@/lib/hash";
import { generateCode, sendSms } from "@/lib/sms";
import { phoneSchema, normalizePhone } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { RATE_LIMITS, SMS_CODE_EXPIRY_MINUTES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = phoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Turnstile captcha
    const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken);
    if (!turnstileOk) {
      return NextResponse.json(
        { error: "Captcha-verifikation fejlede" },
        { status: 400 }
      );
    }

    const phone = normalizePhone(parsed.data.phone);
    const phoneHash = hashPhone(phone);

    // Rate limit: per telefon
    const phoneLimit = checkRateLimit(
      "sms-phone",
      phoneHash,
      RATE_LIMITS.smsPerPhone.max,
      RATE_LIMITS.smsPerPhone.windowMs
    );
    if (!phoneLimit.ok) {
      return NextResponse.json(
        { error: "For mange forsøg. Prøv igen om en time." },
        { status: 429 }
      );
    }

    // Rate limit: globalt
    const globalLimit = checkRateLimit(
      "sms-global",
      "global",
      RATE_LIMITS.smsGlobal.max,
      RATE_LIMITS.smsGlobal.windowMs
    );
    if (!globalLimit.ok) {
      return NextResponse.json(
        { error: "Tjenesten er midlertidigt overbelastet. Prøv igen senere." },
        { status: 429 }
      );
    }

    // Generer kode og gem
    const code = generateCode();
    const expiresAt = new Date(
      Date.now() + SMS_CODE_EXPIRY_MINUTES * 60 * 1000
    );

    await prisma.smsVerification.create({
      data: { phoneHash, code, expiresAt },
    });

    // Send SMS
    await sendSms(phone, `Din Stem Palæstina kode er: ${code}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("verify/request error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
