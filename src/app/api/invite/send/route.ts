import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/constants";

const inviteSchema = z.object({
  method: z.enum(["email", "sms"]),
  to: z.string().min(1, "Modtager mangler"),
  candidateName: z.string().min(1, "Kandidatnavn mangler"),
});

function getBaseUrl() {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return "https://stem-palaestina.vercel.app";
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
    const limit = checkRateLimit(
      "invite-ip",
      ip,
      RATE_LIMITS.invitePerIp.max,
      RATE_LIMITS.invitePerIp.windowMs
    );
    if (!limit.ok) {
      return NextResponse.json(
        { error: "For mange invitationer. Prøv igen om en time." },
        { status: 429 }
      );
    }

    const { method, to, candidateName } = parsed.data;
    const link = `${getBaseUrl()}/stem`;

    if (method === "email") {
      const subject = `Invitation: Tag stilling på Stem Palæstina`;
      const emailBody = `Hej ${candidateName},\n\nDu er blevet inviteret til at tage stilling til de tre krav på Stem Palæstina.\n\nRegistrer dig som kandidat her: ${link}\n\nDe tre krav:\n1. Anerkend Palæstina\n2. Stop våbensalg til Israel\n3. Stop ulovlige investeringer\n\nMed venlig hilsen\nStem Palæstina`;

      await sendEmail(to, subject, emailBody);
    } else {
      const smsBody = `Hej ${candidateName}! Du er inviteret til at tage stilling på Stem Palæstina. Registrer dig her: ${link}`;
      await sendSms(to, smsBody);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("invite/send error:", error);
    const msg = error instanceof Error ? error.message : "";

    if (msg.includes("Invalid") && msg.includes("Phone Number")) {
      return NextResponse.json(
        { error: "Ugyldigt telefonnummer." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Kunne ikke sende invitation. Prøv igen." },
      { status: 500 }
    );
  }
}
