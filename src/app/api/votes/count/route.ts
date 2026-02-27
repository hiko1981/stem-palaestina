import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VOTE_BUNDLE_THRESHOLD } from "@/lib/constants";

export async function GET() {
  try {
    const [total, jaCount, candidateCount] = await Promise.all([
      prisma.vote.count(),
      prisma.vote.count({ where: { voteValue: true } }),
      prisma.candidate.count({ where: { verified: true } }),
    ]);

    const nejCount = total - jaCount;
    const thresholdReached = total >= VOTE_BUNDLE_THRESHOLD;

    return NextResponse.json(
      {
        total,
        ja: thresholdReached ? jaCount : null,
        nej: thresholdReached ? nejCount : null,
        thresholdReached,
        candidateCount,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("votes/count error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
