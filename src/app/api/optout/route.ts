import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const optoutSchema = z.object({
  token: z.string().uuid("Ugyldig token"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = optoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Rate limit per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit("optout-ip", ip, 10, 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "For mange forsøg. Prøv igen senere." },
        { status: 429 }
      );
    }

    // Look up ballot token to get phoneHash
    const ballot = await prisma.ballotToken.findUnique({
      where: { token: parsed.data.token },
    });

    if (!ballot) {
      return NextResponse.json(
        { error: "Ugyldig stemmeseddel." },
        { status: 404 }
      );
    }

    // Upsert phone suppression
    await prisma.phoneSuppression.upsert({
      where: { phoneHash: ballot.phoneHash },
      create: {
        phoneHash: ballot.phoneHash,
        scope: "all",
        reason: "user_request",
      },
      update: {},
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("optout error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
