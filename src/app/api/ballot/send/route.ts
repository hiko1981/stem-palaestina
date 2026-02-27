import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPhone } from "@/lib/hash";
import { sendSms } from "@/lib/sms";
import { ballotRequestSchema } from "@/lib/validation";
import { normalizeToE164, isValidE164 } from "@/lib/phone";
import { checkAndReserveSlot } from "@/lib/ballot-slots";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkPhoneType } from "@/lib/phone-lookup";
import { RATE_LIMITS, BALLOT_EXPIRY_HOURS } from "@/lib/constants";

function getBaseUrl() {
  // VERCEL_PROJECT_PRODUCTION_URL is auto-set by Vercel (no protocol)
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  // Explicit override (e.g. custom domain)
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return "https://stem-palaestina.vercel.app";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ballotRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Normalize phone
    const phone = normalizeToE164(parsed.data.phone, parsed.data.dialCode);
    if (!phone || !isValidE164(phone)) {
      return NextResponse.json(
        { error: "Ugyldigt telefonnummer" },
        { status: 400 }
      );
    }

    const phoneHash = hashPhone(phone);

    // Check if already voted
    const existingVote = await prisma.vote.findUnique({
      where: { phoneHash },
    });
    if (existingVote) {
      return NextResponse.json(
        { error: "Stemmeseddel er allerede afsendt til dette nummer." },
        { status: 409 }
      );
    }

    // Rate limit: per phone
    const phoneLimit = checkRateLimit(
      "ballot-phone",
      phoneHash,
      RATE_LIMITS.ballotPerPhone.max,
      RATE_LIMITS.ballotPerPhone.windowMs
    );
    if (!phoneLimit.ok) {
      return NextResponse.json(
        { error: "For mange forsøg. Prøv igen om en time." },
        { status: 429 }
      );
    }

    // Rate limit: global
    const globalLimit = checkRateLimit(
      "ballot-global",
      "global",
      RATE_LIMITS.ballotGlobal.max,
      RATE_LIMITS.ballotGlobal.windowMs
    );
    if (!globalLimit.ok) {
      return NextResponse.json(
        { error: "Tjenesten er midlertidigt overbelastet. Prøv igen senere." },
        { status: 429 }
      );
    }

    // Check phone type (block VoIP/virtual numbers)
    const phoneType = await checkPhoneType(phone);
    if (!phoneType.ok) {
      return NextResponse.json(
        { error: phoneType.error },
        { status: 403 }
      );
    }

    // Check device slots (if deviceId provided)
    const deviceId = parsed.data.deviceId;
    if (deviceId) {
      const slotResult = await checkAndReserveSlot(deviceId, phoneHash);
      if (!slotResult.ok) {
        return NextResponse.json(
          { error: slotResult.error },
          { status: 429 }
        );
      }
    }

    // Create ballot token
    const token = randomUUID();
    const expiresAt = new Date(
      Date.now() + BALLOT_EXPIRY_HOURS * 60 * 60 * 1000
    );

    await prisma.ballotToken.create({
      data: {
        token,
        phoneHash,
        deviceId: deviceId || null,
        expiresAt,
      },
    });

    // Send SMS with ballot link (include role context as query params)
    const params = new URLSearchParams();
    if (parsed.data.role === "candidate") {
      params.set("r", "c");
      if (parsed.data.candidateId) params.set("cid", parsed.data.candidateId);
    }
    const qs = params.toString();
    const ballotUrl = `${getBaseUrl()}/stem/${token}${qs ? `?${qs}` : ""}`;
    const smsText = parsed.data.role === "candidate"
      ? `Registrér dig som kandidat på Stem Palæstina: ${ballotUrl}\n\nStem og udfyld din kandidatprofil. Linket udløber om ${BALLOT_EXPIRY_HOURS} timer.`
      : `Din stemmeseddel til Stem Palæstina: ${ballotUrl}\n\nLinket udløber om ${BALLOT_EXPIRY_HOURS} timer.`;
    await sendSms(phone, smsText);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ballot/send error:", error);

    // Surface Twilio "invalid phone" errors to the user
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Invalid") && msg.includes("Phone Number")) {
      return NextResponse.json(
        { error: "Ugyldigt telefonnummer. Tjek nummer og landekode." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
