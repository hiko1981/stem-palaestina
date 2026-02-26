import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { voteSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Rate limit per IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = checkRateLimit(
      "vote-ip",
      ip,
      RATE_LIMITS.votePerIp.max,
      RATE_LIMITS.votePerIp.windowMs
    );
    if (!limit.ok) {
      return NextResponse.json(
        { error: "For mange forsøg. Prøv igen senere." },
        { status: 429 }
      );
    }

    // Verificer JWT
    const payload = await verifyToken(parsed.data.token);
    if (!payload) {
      return NextResponse.json(
        { error: "Ugyldig eller udløbet token. Start forfra." },
        { status: 401 }
      );
    }

    // Gem stemme (tokenId er unik — forhindrer dobbelt-stemme)
    try {
      await prisma.vote.create({
        data: { tokenId: payload.tid },
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        return NextResponse.json(
          { error: "Du har allerede afgivet din stemme." },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("vote error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
