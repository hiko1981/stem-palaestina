import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPhone } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import { verifyCodeSchema, normalizePhone } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS, SMS_MAX_ATTEMPTS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const phone = normalizePhone(parsed.data.phone);
    const phoneHash = hashPhone(phone);

    // Rate limit
    const limit = checkRateLimit(
      "verify-phone",
      phoneHash,
      RATE_LIMITS.verifyPerPhone.max,
      RATE_LIMITS.verifyPerPhone.windowMs
    );
    if (!limit.ok) {
      return NextResponse.json(
        { error: "For mange forsøg. Prøv igen om 15 minutter." },
        { status: 429 }
      );
    }

    // Find seneste ubrugte, ikke-udløbne verifikation
    const verification = await prisma.smsVerification.findFirst({
      where: {
        phoneHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Ingen aktiv verifikation. Anmod om en ny kode." },
        { status: 400 }
      );
    }

    // Tjek forsøg
    if (verification.attempts >= SMS_MAX_ATTEMPTS) {
      await prisma.smsVerification.update({
        where: { id: verification.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: "For mange forkerte forsøg. Anmod om en ny kode." },
        { status: 400 }
      );
    }

    // Tjek kode
    if (verification.code !== parsed.data.code) {
      await prisma.smsVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        {
          error: "Forkert kode. Prøv igen.",
          attemptsLeft: SMS_MAX_ATTEMPTS - verification.attempts - 1,
        },
        { status: 400 }
      );
    }

    // Kode er korrekt — marker som brugt
    await prisma.smsVerification.update({
      where: { id: verification.id },
      data: { used: true },
    });

    // Gem telefon-hash (idempotent — kan allerede eksistere fra tidligere)
    await prisma.verifiedPhone.upsert({
      where: { phoneHash },
      update: {},
      create: { phoneHash },
    });

    // Tjek om dette nummer allerede har stemt
    // Vi kan IKKE tjekke dette direkte pga. anonymitet.
    // Men vi kan forhindre at et telefonnummer verificeres og stemmer mere end én gang
    // ved at tjekke om der allerede er en stemme tilknyttet dette phone-hash via en
    // separat mekanisme — men det ville bryde anonymiteten.
    // Løsning: Vi genererer bare et nyt token. Stemme-endpointet sikrer unik tokenId.

    // Generer anonym token — INGEN kobling til phoneHash gemmes
    const tokenId = randomUUID();
    const token = await signToken(tokenId);

    return NextResponse.json({ ok: true, token });
  } catch (error) {
    console.error("verify/confirm error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
