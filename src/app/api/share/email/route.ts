import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { getShareEmail } from "@/lib/share-translations";

const schema = z.object({
  email: z.string().email(),
  locale: z.string().max(5).optional(),
});

function getBaseUrl() {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return "https://stem-palaestina.vercel.app";
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Rate limit per IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit("share-email-ip", ip, 10, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "For mange forsøg. Prøv igen senere." },
        { status: 429 }
      );
    }

    const locale = parsed.data.locale || "da";
    const { subject, body } = getShareEmail(locale, getBaseUrl());

    await sendEmail(parsed.data.email, subject, body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("share/email error:", error);
    return NextResponse.json(
      { error: "Kunne ikke sende e-mail. Prøv igen senere." },
      { status: 500 }
    );
  }
}
