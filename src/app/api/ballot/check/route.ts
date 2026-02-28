import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit("ballot-check-ip", ip, RATE_LIMITS.ballotCheckPerIp.max, RATE_LIMITS.ballotCheckPerIp.windowMs);
    if (!limit.ok) {
      return NextResponse.json({ error: "For mange forespørgsler." }, { status: 429 });
    }

    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { status: "not_found" },
        { status: 400 }
      );
    }

    const ballot = await prisma.ballotToken.findUnique({
      where: { token },
    });

    if (!ballot) {
      return NextResponse.json({ status: "not_found" });
    }

    if (ballot.used) {
      return NextResponse.json({ status: "used" });
    }

    if (new Date() > ballot.expiresAt) {
      return NextResponse.json({ status: "expired" });
    }

    // Check if this phone already voted
    const existingVote = await prisma.vote.findUnique({
      where: { phoneHash: ballot.phoneHash },
    });
    if (existingVote) {
      return NextResponse.json({ status: "already_voted" });
    }

    return NextResponse.json({ status: "valid" });
  } catch (error) {
    console.error("ballot/check error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
