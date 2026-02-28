import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
});

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

    await sendEmail(parsed.data.email, parsed.data.subject, parsed.data.body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("share/email error:", error);
    return NextResponse.json(
      { error: "Kunne ikke sende e-mail." },
      { status: 500 }
    );
  }
}
