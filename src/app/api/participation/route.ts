import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const deviceId = req.nextUrl.searchParams.get("deviceId");
    if (!deviceId) {
      return NextResponse.json({ participated: false });
    }

    // Rate limit per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit("participation-ip", ip, 30, 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json({ error: "For mange forespørgsler." }, { status: 429 });
    }

    const record = await prisma.deviceParticipation.findUnique({
      where: { deviceId },
    });

    if (!record) {
      return NextResponse.json({ participated: false });
    }

    // Look up the actual vote to get voteValue
    const vote = await prisma.vote.findUnique({
      where: { phoneHash: record.phoneHash },
      select: { voteValue: true },
    });

    return NextResponse.json({
      participated: true,
      voteValue: vote?.voteValue ?? null,
    });
  } catch (error) {
    console.error("participation check error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
