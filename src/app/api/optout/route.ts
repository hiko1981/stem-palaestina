import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const optoutSchema = z.object({
  token: z.string().uuid("invalidToken"),
});

export async function POST(req: NextRequest) {
  try {
    const te = await getTranslations("errors");

    const body = await req.json();
    const parsed = optoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: te("invalidToken") },
        { status: 400 }
      );
    }

    // Rate limit per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit("optout-ip", ip, 10, 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: te("tooManyRetry") },
        { status: 429 }
      );
    }

    // Look up ballot token to get phoneHash
    const ballot = await prisma.ballotToken.findUnique({
      where: { token: parsed.data.token },
    });

    if (!ballot) {
      return NextResponse.json(
        { error: te("invalidBallot") },
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
    const te = await getTranslations("errors");
    return NextResponse.json(
      { error: te("serverError") },
      { status: 500 }
    );
  }
}
