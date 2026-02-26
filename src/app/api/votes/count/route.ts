import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VOTE_BUNDLE_THRESHOLD } from "@/lib/constants";

export async function GET() {
  try {
    const count = await prisma.vote.count();

    return NextResponse.json(
      {
        count: count >= VOTE_BUNDLE_THRESHOLD ? count : null,
        thresholdReached: count >= VOTE_BUNDLE_THRESHOLD,
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
