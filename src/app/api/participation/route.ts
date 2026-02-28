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

    const response = NextResponse.json({
      participated: true,
      voteValue: vote?.voteValue ?? null,
    });
    // Set cookies so vote state persists across browser contexts
    const cookieOpts = "Path=/; Max-Age=31536000; SameSite=Lax; Secure";
    response.headers.append("Set-Cookie", `stem_voted=1; ${cookieOpts}`);
    if (vote?.voteValue !== undefined) {
      response.headers.append("Set-Cookie", `stem_vote_value=${vote.voteValue}; ${cookieOpts}`);
    }
    response.headers.append("Set-Cookie", `stem_device_id=${deviceId}; ${cookieOpts}`);
    return response;
  } catch (error) {
    console.error("participation check error:", error);
    return NextResponse.json(
      { error: "Intern serverfejl" },
      { status: 500 }
    );
  }
}
