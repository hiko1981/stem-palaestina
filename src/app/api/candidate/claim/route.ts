import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { candidateClaimSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = candidateClaimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
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
        { error: "Ugyldig stemmeseddel" },
        { status: 400 }
      );
    }

    // Verify that this phone has actually voted
    const vote = await prisma.vote.findUnique({
      where: { phoneHash: ballotToken.phoneHash },
    });
    if (!vote) {
      return NextResponse.json(
        { error: "Du skal stemme før du kan claime en kandidat" },
        { status: 400 }
      );
    }

    // Check if this phone already has a claimed candidate
    const existingClaim = await prisma.candidate.findFirst({
      where: { phoneHash: ballotToken.phoneHash },
    });
    if (existingClaim) {
      return NextResponse.json(
        { error: "Du er allerede registreret som kandidat" },
        { status: 409 }
      );
    }

    // Atomic claim: only succeeds if phoneHash is still NULL (race-safe)
    const result = await prisma.candidate.updateMany({
      where: { id: candidateId, phoneHash: null },
      data: { phoneHash: ballotToken.phoneHash, verified: true },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Kandidaten er allerede optaget" },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("candidate/claim error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
