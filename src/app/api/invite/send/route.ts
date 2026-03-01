import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { signOptout } from "@/lib/optout-sig";

const inviteSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("email"),
    candidateId: z.number().int().positive(),
    deviceId: z.string().optional(),
  }),
  z.object({
    method: z.literal("sms"),
    candidateId: z.number().int().positive(),
    deviceId: z.string().optional(),
  }),
]);

function getBaseUrl() {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return "https://vote-palestine.com";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Rate limit per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit(
      "invite-ip",
      ip,
      RATE_LIMITS.invitePerIp.max,
      RATE_LIMITS.invitePerIp.windowMs
    );
    if (!limit.ok) {
      return NextResponse.json(
        { error: "rateLimited" },
        { status: 429 }
      );
    }

    const link = `${getBaseUrl()}/?panel=candidate`;

    if (parsed.data.method === "email") {
      // Server-side email: look up candidate's contactEmail
      const { candidateId, deviceId } = parsed.data;

      // Rate limit: 1 email per candidate per device per hour
      const deviceKey = deviceId || ip;
      const perCandidateLimit = await checkRateLimit(
        "invite-candidate",
        `${deviceKey}:${candidateId}`,
        1,
        60 * 60 * 1000
      );
      if (!perCandidateLimit.ok) {
        return NextResponse.json(
          { error: "alreadyInvited" },
          { status: 429 }
        );
      }

      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { name: true, contactEmail: true, optedOut: true },
      });

      if (!candidate || !candidate.contactEmail) {
        return NextResponse.json(
          { error: "noEmail" },
          { status: 400 }
        );
      }

      // Public error: candidate has opted out
      if (candidate.optedOut) {
        return NextResponse.json(
          { error: "candidateOptedOut" },
          { status: 403 }
        );
      }

      const optoutSig = signOptout(candidateId);
      const optoutUrl = `${getBaseUrl()}/afmeld/kandidat?cid=${candidateId}&sig=${optoutSig}`;

      const subject = `Invitation: Tag stilling på Stem Palæstina`;
      const emailBody = `Hej ${candidate.name},\n\nEn vælger har inviteret dig til at tage stilling til de tre krav på Stem Palæstina.\n\nRegistrer dig som kandidat her: ${link}\n\nDe tre krav:\n1. Anerkend Palæstina\n2. Stop våbensalg til Israel\n3. Stop ulovlige investeringer\n\nMed venlig hilsen\nStem Palæstina\n\n---\nØnsker du ikke flere henvendelser? Afmeld dig her: ${optoutUrl}`;

      await sendEmail(candidate.contactEmail, subject, emailBody);
    } else {
      // SMS invite: look up candidate's stored contactPhone
      const { candidateId, deviceId } = parsed.data;

      // Rate limit: 1 SMS per candidate per device per hour
      const deviceKey = deviceId || ip;
      const perCandidateSmsLimit = await checkRateLimit(
        "invite-sms-candidate",
        `${deviceKey}:${candidateId}`,
        1,
        60 * 60 * 1000
      );
      if (!perCandidateSmsLimit.ok) {
        return NextResponse.json(
          { error: "alreadyInvited" },
          { status: 429 }
        );
      }

      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { name: true, contactPhone: true, optedOut: true },
      });

      if (!candidate || !candidate.contactPhone) {
        return NextResponse.json(
          { error: "noPhone" },
          { status: 400 }
        );
      }

      if (candidate.optedOut) {
        return NextResponse.json(
          { error: "candidateOptedOut" },
          { status: 403 }
        );
      }

      // Format phone as E.164 for Twilio (assume Danish +45 if no prefix)
      const phone = candidate.contactPhone.startsWith("+")
        ? candidate.contactPhone
        : `+45${candidate.contactPhone.replace(/\s+/g, "")}`;

      const smsBody = `Hej ${candidate.name}! En vælger har inviteret dig til at tage stilling på Stem Palæstina. Registrer dig her: ${link}`;
      await sendSms(phone, smsBody);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("invite/send error:", error);
    const msg = error instanceof Error ? error.message : "";

    if (msg.includes("Invalid") && msg.includes("Phone Number")) {
      return NextResponse.json(
        { error: "invalidPhone" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "sendError" },
      { status: 500 }
    );
  }
}
