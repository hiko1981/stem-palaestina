import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      select: {
        id: true,
        name: true,
        party: true,
        constituency: true,
        contactEmail: true,
        phoneHash: true,
        verified: true,
      },
    });

    // Get all candidate phone hashes and look up their votes
    const phoneHashes = candidates
      .map((c) => c.phoneHash)
      .filter((h): h is string => h !== null);

    const votes = await prisma.vote.findMany({
      where: { phoneHash: { in: phoneHashes } },
      select: { phoneHash: true, voteValue: true },
    });

    const voteMap = new Map(votes.map((v) => [v.phoneHash, v.voteValue]));

    const result = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      party: c.party,
      constituency: c.constituency,
      hasEmail: !!c.contactEmail,
      verified: c.verified,
      voteValue: c.phoneHash ? (voteMap.get(c.phoneHash) ?? null) : null,
    }));

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("votes/candidates error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
