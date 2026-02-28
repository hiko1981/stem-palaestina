import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ballotVoteSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { freeSlot } from "@/lib/ballot-slots";
import { RATE_LIMITS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ballotVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Mobile-only: reject desktop user-agents
    const ua = req.headers.get("user-agent") || "";
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    if (!isMobile) {
      return NextResponse.json(
        { error: "Stemmer kan kun afgives fra en mobilenhed." },
        { status: 403 }
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

    // Look up ballot token
    const ballot = await prisma.ballotToken.findUnique({
      where: { token: parsed.data.token },
    });

    if (!ballot) {
      return NextResponse.json(
        { error: "Ugyldig stemmeseddel." },
        { status: 404 }
      );
    }

    if (ballot.used) {
      return NextResponse.json(
        { error: "Denne stemmeseddel er allerede brugt." },
        { status: 409 }
      );
    }

    if (new Date() > ballot.expiresAt) {
      return NextResponse.json(
        { error: "Stemmesedlen er udløbet. Anmod om en ny." },
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
        { error: "Du har allerede afgivet din stemme." },
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

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    // Handle unique constraint violation (race condition)
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
    console.error("vote error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
