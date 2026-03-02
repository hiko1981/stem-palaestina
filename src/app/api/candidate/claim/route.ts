import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { candidateClaimSchema } from "@/lib/validation";
import { notifyAdminNewCandidate } from "@/lib/admin-notify";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const te = await getTranslations("errors");
    const tv = await getTranslations("validation");

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await checkRateLimit("candidate-claim", ip, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: te("tooManyWait") },
        { status: 429 }
      );
    }
    const body = await req.json();
    const parsed = candidateClaimSchema.safeParse(body);
    if (!parsed.success) {
      const key = parsed.error.issues[0].message;
      return NextResponse.json(
        { error: tv.has(key) ? tv(key) : key },
        { status: 400 }
      );
    }

    const { candidateId, token } = parsed.data;

    // Look up ballot token to get phoneHash
    const ballotToken = await prisma.ballotToken.findUnique({
      where: { token },
      select: { phoneHash: true },
    });
    if (!ballotToken) {
      return NextResponse.json(
        { error: te("invalidBallot") },
        { status: 400 }
      );
    }

    // Verify that this phone has actually voted
    const vote = await prisma.vote.findUnique({
      where: { phoneHash: ballotToken.phoneHash },
    });
    if (!vote) {
      return NextResponse.json(
        { error: te("mustVoteToClaim") },
        { status: 400 }
      );
    }

    // Check if this phone already has a claimed candidate
    const existingClaim = await prisma.candidate.findFirst({
      where: { phoneHash: ballotToken.phoneHash },
    });
    if (existingClaim) {
      return NextResponse.json(
        { error: te("alreadyRegistered") },
        { status: 409 }
      );
    }

    // Atomic claim: only succeeds if phoneHash is still NULL (race-safe)
    // verified stays false — admin must approve manually
    const result = await prisma.candidate.updateMany({
      where: { id: candidateId, phoneHash: null },
      data: {
        phoneHash: ballotToken.phoneHash,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: te("candidateTaken") },
        { status: 409 }
      );
    }

    // Look up candidate name for admin notification
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { name: true, party: true, constituency: true },
    });
    if (candidate) {
      notifyAdminNewCandidate(candidate.name, candidate.party, candidate.constituency);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("candidate/claim error:", error);
    const te = await getTranslations("errors");
    return NextResponse.json(
      { error: te("serverError") },
      { status: 500 }
    );
  }
}
