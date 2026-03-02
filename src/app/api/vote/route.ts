import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ballotVoteSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { freeSlot } from "@/lib/ballot-slots";
import { RATE_LIMITS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const te = await getTranslations("errors");
    const tv = await getTranslations("validation");

    const body = await req.json();
    const parsed = ballotVoteSchema.safeParse(body);
    if (!parsed.success) {
      const key = parsed.error.issues[0].message;
      return NextResponse.json(
        { error: tv.has(key) ? tv(key) : key },
        { status: 400 }
      );
    }

    // Mobile-only: reject desktop user-agents
    const ua = req.headers.get("user-agent") || "";
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    if (!isMobile) {
      return NextResponse.json(
        { error: te("mobileOnly") },
        { status: 403 }
      );
    }

    // Rate limit per IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit(
      "vote-ip",
      ip,
      RATE_LIMITS.votePerIp.max,
      RATE_LIMITS.votePerIp.windowMs
    );
    if (!limit.ok) {
      return NextResponse.json(
        { error: te("tooManyRetry") },
        { status: 429 }
      );
    }

    // Look up ballot token
    const ballot = await prisma.ballotToken.findUnique({
      where: { token: parsed.data.token },
    });

    if (!ballot) {
      return NextResponse.json(
        { error: te("invalidBallot") },
        { status: 404 }
      );
    }

    if (ballot.used) {
      return NextResponse.json(
        { error: te("ballotUsed") },
        { status: 409 }
      );
    }

    if (new Date() > ballot.expiresAt) {
      return NextResponse.json(
        { error: te("ballotExpired") },
        { status: 410 }
      );
    }

    // Check if phone already voted
    const existingVote = await prisma.vote.findUnique({
      where: { phoneHash: ballot.phoneHash },
    });
    if (existingVote) {
      // Mark ballot as used even if phone already voted
      await prisma.ballotToken.update({
        where: { id: ballot.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: te("alreadyCast") },
        { status: 409 }
      );
    }

    // Cast vote, mark ballot as used, and record device participation
    const deviceId = parsed.data.deviceId || ballot.deviceId;

    const txOps = [
      prisma.vote.create({
        data: {
          phoneHash: ballot.phoneHash,
          voteValue: parsed.data.voteValue,
        },
      }),
      prisma.ballotToken.update({
        where: { id: ballot.id },
        data: { used: true },
      }),
    ];

    await prisma.$transaction(txOps);

    // Record device participation (best-effort, outside transaction)
    if (deviceId) {
      prisma.deviceParticipation.upsert({
        where: { deviceId },
        create: { deviceId, phoneHash: ballot.phoneHash },
        update: { phoneHash: ballot.phoneHash },
      }).catch(() => {});

      // Free the device slot (best-effort)
      freeSlot(deviceId, ballot.token).catch(() => {});
    }

    const response = NextResponse.json({ ok: true });
    // Set cookies so vote state persists across browser contexts (Safari/PWA/iMessage)
    const cookieOpts = "Path=/; Max-Age=31536000; SameSite=Lax; Secure";
    response.headers.append("Set-Cookie", `stem_voted=1; ${cookieOpts}`);
    response.headers.append("Set-Cookie", `stem_vote_value=${parsed.data.voteValue}; ${cookieOpts}`);
    if (deviceId) {
      response.headers.append("Set-Cookie", `stem_device_id=${deviceId}; ${cookieOpts}`);
    }
    return response;
  } catch (error: unknown) {
    // Handle unique constraint violation (race condition)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      const te = await getTranslations("errors");
      return NextResponse.json(
        { error: te("alreadyCast") },
        { status: 409 }
      );
    }
    console.error("vote error:", error);
    const te = await getTranslations("errors");
    return NextResponse.json(
      { error: te("serverError") },
      { status: 500 }
    );
  }
}
