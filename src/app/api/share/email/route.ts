import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
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

    const url = getBaseUrl();

    const subject = "En vælger har delt Stem Palæstina med dig";
    const body = `Hej,

En vælger på Stem Palæstina har valgt at dele appen med dig.

Stem Palæstina er en uafhængig afstemning hvor danske vælgere kan tage stilling til tre krav:

1. Anerkend Palæstina
2. Stop våbensalg til Israel
3. Stop ulovlige investeringer

Brug din stemme her:
${url}

Med venlig hilsen
Stem Palæstina`;

    await sendEmail(parsed.data.email, subject, body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("share/email error:", error);
    return NextResponse.json(
      { error: "Kunne ikke sende e-mail." },
      { status: 500 }
    );
  }
}
